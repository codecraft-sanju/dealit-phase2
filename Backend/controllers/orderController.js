// orderController.js
const Order = require('../models/Order');
const Item = require('../models/Item');
const User = require('../models/User');
const CreditSetting = require('../models/CreditSetting');
const Transaction = require('../models/Transaction'); 
const crypto = require('crypto'); 
const BarterRequest = require('../models/BarterRequest'); 

const { queueNotification } = require('../services/queue');
const { checkServiceability, createShiprocketOrder, addPickupLocation, generateAWB, generateLabel, schedulePickup, getTrackingByAWB, getShiprocketOrderDetails } = require('../utils/shiprocket'); 
const AuraLog = require('../models/AuraLog'); 
const { refundRazorpayPayment, fetchRazorpayPaymentInfo } = require('./paymentController');

// ---> WHATSAPP MODIFICATION START
const { sendWhatsAppMessage } = require('../services/whatsappService');
// ---> WHATSAPP MODIFICATION END

const calculateFees = (baseShipping) => {
  const platformFee = parseFloat((baseShipping * 0.02).toFixed(2));
  const gstAmount = parseFloat((baseShipping * 0.18).toFixed(2));
  const totalShippingCost = Math.round(baseShipping + platformFee + gstAmount);
  return { baseShipping, platformFee, gstAmount, totalShippingCost };
};


const calculateShippingCost = async (req, res) => {
  try {
    const { itemId, pincode } = req.body;
    const item = await Item.findById(itemId).populate('owner', 'pickupAddress');
    
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    let setting = await CreditSetting.findOne();
    let baseShipping = 60; // Renamed to baseShipping

    if (setting) {
      if (setting.shippingMethod === 'dynamic') {
        const pickupPincode = item.owner.pickupAddress?.pincode;
        if (!pickupPincode) {
          return res.status(400).json({ success: false, message: 'Seller pickup pincode missing.' });
        }
        const weight = item.weight || 0.5;
        const dimensions = item.dimensions || { length: 10, width: 10, height: 10 }; 
        baseShipping = await checkServiceability(pickupPincode, pincode, weight, dimensions);
      } else {
        baseShipping = setting.flatShippingCost !== undefined ? setting.flatShippingCost : 60;
      }
    }

    // CHANGES MADE HERE: Calculate breakdown and return to frontend
    const feeDetails = calculateFees(baseShipping);

    res.status(200).json({ 
      success: true, 
      shippingCost: feeDetails.totalShippingCost, // The final amount user pays
      feeBreakdown: feeDetails // Sending the breakdown so frontend can show it nicely
    });
  } catch (error) {
    console.error('Error calculating shipping:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error calculating shipping' });
  }
};

const createOrder = async (req, res) => {
  try {
    const { itemId, shippingAddress, paymentDetails } = req.body;
    const buyerId = req.user._id;

    // ---> WHATSAPP MODIFICATION START (Added 'phone' to populate)
    const item = await Item.findById(itemId).populate('owner', 'pickupAddress phone');
    // ---> WHATSAPP MODIFICATION END

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    if (item.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This item is no longer available for sale' });
    }
    if (item.owner._id.toString() === buyerId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot buy your own item' });
    }

    let setting = await CreditSetting.findOne();
    let baseShipping = 60; // CHANGES MADE HERE: Renamed to baseShipping

    if (setting) {
      if (setting.shippingMethod === 'dynamic') {
        const pickupPincode = item.owner.pickupAddress?.pincode;
        const weight = item.weight || 0.5;
        const dimensions = item.dimensions || { length: 10, width: 10, height: 10 };
        baseShipping = await checkServiceability(pickupPincode, shippingAddress.pincode, weight, dimensions);
      } else {
        baseShipping = setting.flatShippingCost !== undefined ? setting.flatShippingCost : 60;
      }
    }

    // CHANGES MADE HERE: Calculate exact fees
    const feeDetails = calculateFees(baseShipping);
    const finalShippingCost = feeDetails.totalShippingCost;

    let razorpay_order_id, razorpay_payment_id;

    if (finalShippingCost > 0) {
      if (!paymentDetails || !paymentDetails.razorpay_payment_id) {
        return res.status(400).json({ success: false, message: 'Shipping payment details missing' });
      }

      razorpay_order_id = paymentDetails.razorpay_order_id;
      razorpay_payment_id = paymentDetails.razorpay_payment_id;
      const { razorpay_signature } = paymentDetails;

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature. Shipping payment verification failed.' });
      }
      
      const paymentCheck = await fetchRazorpayPaymentInfo(razorpay_payment_id);
      if (!paymentCheck.success) {
        return res.status(400).json({ success: false, message: 'Failed to verify payment details with Razorpay.' });
      }
      const actualPaidINR = paymentCheck.data.amount / 100;
      
      // CHANGES MADE HERE: Check actual payment against new total (Base + Platform + GST)
      if (actualPaidINR < finalShippingCost) {
        return res.status(400).json({ success: false, message: `Payment manipulation detected. Expected ₹${finalShippingCost} but received ₹${actualPaidINR}.` });
      }

      const newTransaction = new Transaction({
        user: buyerId,
        amount: finalShippingCost, // Use final cost here
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        status: 'success',
        transactionType: 'shipping_fee'
      });
      await newTransaction.save();
    }

    const itemPrice = item.estimated_value || 0;

    const buyer = await User.findById(buyerId);
    if (buyer.account_credits < itemPrice) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient credits. You need ${itemPrice} credits for this item.`,
        requiredCredits: itemPrice,
        currentCredits: buyer.account_credits
      });
    }

    let updateQuery = { $inc: { account_credits: -itemPrice } };

    if (!buyer.savedAddresses) buyer.savedAddresses = [];
    const isAddressExist = buyer.savedAddresses.some(addr => 
      addr.houseNo === shippingAddress.houseNo && 
      addr.pincode === shippingAddress.pincode
    );

    if (!isAddressExist) {
      updateQuery.$push = { savedAddresses: shippingAddress };
    }

    const updatedBuyer = await User.findOneAndUpdate(
      { _id: buyerId, account_credits: { $gte: itemPrice } },
      updateQuery,
      { new: true }
    );

    if (!updatedBuyer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Transaction failed. Insufficient credits or concurrent request detected.' 
      });
    }

    item.status = 'reserved'; 
    await item.save();

    // CHANGES MADE HERE: Save breakdown inside the Order model
    const order = await Order.create({
      buyer: buyerId,
      seller: item.owner._id,
      item: itemId,
      itemPrice: itemPrice,
      baseShippingCost: feeDetails.baseShipping,
      platformFee: feeDetails.platformFee,
      gstAmount: feeDetails.gstAmount,
      shippingCost: finalShippingCost, // The full amount paid in rupees
      totalAmount: itemPrice + finalShippingCost, // Credits + Full Rupees
      shippingAddress: shippingAddress,
      orderStatus: 'pending',
      paymentStatus: 'paid', 
      isSellerPaid: false,  
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
      trackingDetails: {
        shiprocket_order_id: '',
        shiprocket_shipment_id: '',
        awb_code: '',
        courier_company: ''
      }
    });

    queueNotification({
      user: buyerId,
      type: 'CREDIT_DEDUCTED',
      title: 'Order Confirmed! 🛒',
      message: `You have successfully purchased "${item.title}". ${itemPrice} credits were deducted.`,
      metadata: { amount: itemPrice, reason: 'item_purchase', referenceId: order._id, imageUrl: item.images?.[0] }
    });

    queueNotification({
      user: item.owner._id,
      type: 'ORDER_UPDATE',
      title: 'New Order Received! 🎉',
      message: `Someone has purchased your item "${item.title}". Please pack the item!`,
      metadata: { referenceId: order._id, imageUrl: item.images?.[0] }
    });

    // ---> WHATSAPP MODIFICATION START
    if (buyer && buyer.phone) {
        sendWhatsAppMessage(buyer.phone, 'order_confirmed');
    }
    if (item.owner && item.owner.phone) {
        sendWhatsAppMessage(item.owner.phone, 'new_order_alert');
    }
    // ---> WHATSAPP MODIFICATION END

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Please wait for the seller to dispatch the item.',
      data: order
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Server error during checkout' });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('item', 'title images category condition')
      .populate('seller', 'full_name email')
      .sort({ created_at: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Error fetching buyer orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user._id })
      .populate('item', 'title images')
      .populate('buyer', 'full_name email phone')
      .sort({ created_at: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, cancellationReason } = req.body; 

    const order = await Order.findById(orderId).populate('item');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    order.orderStatus = status;
    
    if (status === 'cancelled') {
      order.cancellationReason = cancellationReason || 'No reason provided';
    }

    order.updated_at = Date.now();

    let setting = await CreditSetting.findOne();
    const auraRewardAmount = setting && setting.auraReward !== undefined ? setting.auraReward : 50;
    const auraPenaltyAmount = setting && setting.auraPenalty !== undefined ? setting.auraPenalty : 50;

    if (status === 'delivered' && order.isSellerPaid === false) {
      const seller = await User.findByIdAndUpdate(order.seller, {
        $inc: {
          account_credits: order.itemPrice,
          aura_points: auraRewardAmount
        }
      }, { new: true });
      
      if (seller) {
        order.isSellerPaid = true;

        const isBarter = order.orderType === 'barter';
        queueNotification({
          user: seller._id,
          type: 'CREDIT_ADDED',
          title: isBarter ? 'Swap Completed! 🎉' : 'Payment Released! 💰',
          message: isBarter 
            ? `Your barter item has been delivered! +${auraRewardAmount} Aura points have been added to your profile.`
            : `Order delivered! ${order.itemPrice} credits and +${auraRewardAmount} Aura have been added to your wallet.`,
          metadata: { amount: order.itemPrice, reason: 'escrow_release', referenceId: order._id, imageUrl: order.item?.images?.[0] }
        });

        await AuraLog.create({
          user: seller._id,
          reason: "Successful Trade Delivered",
          points: auraRewardAmount,
          type: "positive"
        });

        if(order.item) {
           order.item.status = 'swapped';
           await order.item.save();
        }
      }
    }

    if (status === 'cancelled' && order.paymentStatus === 'paid') {
      const buyer = await User.findByIdAndUpdate(order.buyer, {
        $inc: { account_credits: order.itemPrice }
      }, { new: true });
      
      if (buyer) {
        await Transaction.create({
          user: buyer._id,
          amount: order.itemPrice,
          status: 'success',
          transactionType: 'order_refund'
        });
        
        let newPaymentStatus = 'refunded';

        if (order.shippingCost > 0 && order.razorpay_payment_id) {
          const refundRes = await refundRazorpayPayment(order.razorpay_payment_id, order.shippingCost);
          if (refundRes.success) {
            await Transaction.create({
              user: buyer._id,
              amount: order.shippingCost,
              razorpay_order_id: order.razorpay_order_id,
              razorpay_payment_id: order.razorpay_payment_id,
              status: 'success',
              transactionType: 'shipping_refund'
            });
            newPaymentStatus = 'refund_processing'; 
          }
        }
        
        order.paymentStatus = newPaymentStatus;
        
        queueNotification({
          user: buyer._id,
          type: 'CREDIT_ADDED',
          title: 'Order Cancelled & Refunded 🔄',
          message: `The order has been cancelled. Reason: ${order.cancellationReason}. Your ${order.itemPrice} credits have been refunded.`,
          metadata: { amount: order.itemPrice, reason: 'order_refund', referenceId: order._id, imageUrl: order.item?.images?.[0] }
        });

        // ---> WHATSAPP MODIFICATION START
        if (buyer && buyer.phone) {
            sendWhatsAppMessage(buyer.phone, 'order_cancelled_refunded');
        }
        // ---> WHATSAPP MODIFICATION END
        
        const seller = await User.findByIdAndUpdate(order.seller, [
          {
            $set: {
              aura_points: {
                $max: [0, { $subtract: [{ $ifNull: ["$aura_points", 0] }, auraPenaltyAmount] }]
              }
            }
          }
        ], { new: true });
        
        if (seller) {
          await AuraLog.create({
            user: seller._id,
            reason: "Cancelled deal after accepting",
            points: -auraPenaltyAmount,
            type: "negative"
          });

          queueNotification({
            user: seller._id,
            type: 'AURA_UPDATE', 
            title: 'Aura Penalty ⚠️',
            message: `${auraPenaltyAmount} Aura points have been deducted due to the cancelled deal.`,
            metadata: { reason: 'aura_penalty', referenceId: order._id, imageUrl: order.item?.images?.[0] }
          });
        }

        if(order.item) {
           order.item.status = 'active';
           await order.item.save();
        }
      }

      if (order.orderType === 'barter' && order.barterRequestRef) {
        const partnerOrder = await Order.findOne({ 
          barterRequestRef: order.barterRequestRef, 
          _id: { $ne: order._id } 
        });

        if (partnerOrder && partnerOrder.orderStatus !== 'cancelled') {
           partnerOrder.orderStatus = 'cancelled';
           partnerOrder.cancellationReason = 'Partner cancelled their side of the barter deal.';
           
           let pNewPaymentStatus = 'refunded';
           if (partnerOrder.shippingCost > 0 && partnerOrder.razorpay_payment_id) {
             const pRefundRes = await refundRazorpayPayment(partnerOrder.razorpay_payment_id, partnerOrder.shippingCost);
             if (pRefundRes.success) {
               await Transaction.create({
                 user: partnerOrder.buyer,
                 amount: partnerOrder.shippingCost,
                 razorpay_order_id: partnerOrder.razorpay_order_id,
                 razorpay_payment_id: partnerOrder.razorpay_payment_id,
                 status: 'success',
                 transactionType: 'shipping_refund'
               });
               pNewPaymentStatus = 'refund_processing';
             }
           }
           partnerOrder.paymentStatus = pNewPaymentStatus;
           await partnerOrder.save();

           if(partnerOrder.item) {
              await Item.findByIdAndUpdate(partnerOrder.item, { status: 'active' });
           }

           queueNotification({
             user: partnerOrder.buyer,
             type: 'SYSTEM_ALERT',
             title: 'Barter Deal Collapsed 🚫',
             message: `The partner cancelled their side of the deal. Your shipping fee of ₹${partnerOrder.shippingCost} has been refunded.`,
             metadata: { referenceId: partnerOrder._id }
           });

           // ---> WHATSAPP MODIFICATION START
           const partnerBuyer = await User.findById(partnerOrder.buyer);
           if (partnerBuyer && partnerBuyer.phone) {
               sendWhatsAppMessage(partnerBuyer.phone, 'barter_deal_collapsed');
           }
           // ---> WHATSAPP MODIFICATION END
        }

        const barterReq = await BarterRequest.findOneAndUpdate(
            { _id: order.barterRequestRef, status: { $ne: 'CANCELLED' } },
            { $set: { status: 'CANCELLED', updated_at: Date.now() } }
        ).populate('item offered_item');

        if (barterReq) {
           const reqValue = barterReq.item?.estimated_value || 0;
           const offValue = barterReq.offered_item?.estimated_value || 0;
           const diff = Math.max(0, reqValue - offValue);
           
           if (diff > 0) {
             await User.findByIdAndUpdate(barterReq.requester, { $inc: { account_credits: diff } });
             await Transaction.create({
                user: barterReq.requester,
                amount: diff,
                status: 'success',
                transactionType: 'order_refund'
             });
           }
        }
      }
    }

    await order.save();
    res.status(200).json({ success: true, message: `Order marked as ${status}`, data: order });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const processShiprocketAPI = async (orderDoc, itemDoc) => {
    const dynamicPickupLocation = await addPickupLocation(itemDoc.owner);
    const orderDate = new Date().toISOString().slice(0, 19).replace('T', ' '); 
    
    let cleanPhone = orderDoc.shippingAddress.phone.replace(/\D/g, ''); 
    if (cleanPhone.length > 10) cleanPhone = cleanPhone.slice(-10);

    const shiprocketPayload = {
      order_id: orderDoc._id.toString(), 
      order_date: orderDate,
      pickup_location: dynamicPickupLocation, 
      channel_id: "", 
      billing_customer_name: orderDoc.shippingAddress.fullName,
      billing_last_name: "User", 
      billing_address: `${orderDoc.shippingAddress.houseNo}, ${orderDoc.shippingAddress.areaStreet}`,
      billing_address_2: orderDoc.shippingAddress.landmark || "",
      billing_city: orderDoc.shippingAddress.city,
      billing_pincode: orderDoc.shippingAddress.pincode,
      billing_state: orderDoc.shippingAddress.state,
      billing_country: "India",
      billing_email: orderDoc.buyer.email,
      billing_phone: cleanPhone,
      shipping_is_billing: true,
      order_items: [
        {
          name: itemDoc.title,
          sku: itemDoc._id.toString(),
          units: 1,
          selling_price: orderDoc.itemPrice > 0 ? orderDoc.itemPrice : 100, 
          discount: 0,
          tax: 0,
          hsn: ""
        }
      ],
      payment_method: "Prepaid",
      sub_total: orderDoc.itemPrice > 0 ? orderDoc.itemPrice : 100,
      length: itemDoc.dimensions?.length || 10,
      breadth: itemDoc.dimensions?.width || 10,
      height: itemDoc.dimensions?.height || 10,
      weight: itemDoc.weight || 0.5
    };

    return await createShiprocketOrder(shiprocketPayload);
};

const dispatchOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { weight, length, width, height } = req.body;

    const order = await Order.findById(orderId)
      .populate({
        path: 'item', 
        populate: { path: 'owner', select: 'full_name email phone pickupAddress' }
      })
      .populate('buyer', 'full_name email phone');
    
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to dispatch this order' });
    }
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending orders can be dispatched' });
    }

    if (order.trackingDetails && order.trackingDetails.shiprocket_shipment_id) {
      return res.status(400).json({ success: false, message: 'Order is already processing in Shiprocket. Please refresh the page.' });
    }

    const item = order.item;

    if (weight || length || width || height) {
       item.weight = weight || item.weight;
       item.dimensions = {
           length: length || item.dimensions?.length || 10,
           width: width || item.dimensions?.width || 10,
           height: height || item.dimensions?.height || 10,
       };
       await item.save();
    }

    if (order.orderType === 'barter' && order.barterRequestRef) {
        order.isReadyToDispatch = true;
        await order.save();

        const partnerOrder = await Order.findOne({
            barterRequestRef: order.barterRequestRef,
            _id: { $ne: order._id }
        }).populate({
            path: 'item', 
            populate: { path: 'owner', select: 'full_name email phone pickupAddress' }
        }).populate('buyer', 'full_name email phone');

        if (!partnerOrder || !partnerOrder.isReadyToDispatch) {
            const barterReq = await BarterRequest.findById(order.barterRequestRef);
            if (barterReq && !barterReq.first_dispatch_at) {
                barterReq.first_dispatch_at = Date.now();
                await barterReq.save();
            }

            queueNotification({
                user: partnerOrder ? partnerOrder.seller : order.buyer, 
                type: 'SYSTEM',
                title: 'Partner is Ready! ⏳',
                message: `Your partner has packed their item and is ready. You have 24 hours to click Ready to Dispatch, otherwise the deal will be cancelled.`,
                metadata: { referenceId: order.barterRequestRef }
            });

            return res.status(200).json({
                success: true,
                message: 'Marked as Ready to Dispatch! Waiting for your partner to confirm. The deal will auto-cancel if they don\'t respond in 24 hours.',
                data: order
            });
        }

        const barterLock = await BarterRequest.findOneAndUpdate(
            { _id: order.barterRequestRef, shiprocket_synced: { $ne: true } },
            { $set: { shiprocket_synced: true } },
            { new: true }
        );

        if (!barterLock) {
            return res.status(200).json({
                success: true,
                message: 'Both parties are ready! Orders are currently being dispatched.',
                data: order
            });
        }

        try {
            const shiprocketRes1 = await processShiprocketAPI(order, item);
            order.trackingDetails = {
                shiprocket_order_id: shiprocketRes1.order_id,
                shiprocket_shipment_id: shiprocketRes1.shipment_id,
                awb_code: '', courier_company: ''
            };
            order.orderStatus = 'processing';
            await order.save();

            const shiprocketRes2 = await processShiprocketAPI(partnerOrder, partnerOrder.item);
            partnerOrder.trackingDetails = {
                shiprocket_order_id: shiprocketRes2.order_id,
                shiprocket_shipment_id: shiprocketRes2.shipment_id,
                awb_code: '', courier_company: ''
            };
            partnerOrder.orderStatus = 'processing';
            await partnerOrder.save();

            queueNotification({
                user: order.seller,
                type: 'ORDER_UPDATE',
                title: 'Both Ready! Pickup Scheduled 🚚',
                message: `Your partner is also ready! We have scheduled your pickup with Shiprocket.`,
                metadata: { referenceId: order._id, imageUrl: item.images?.[0] }
            });

            queueNotification({
                user: partnerOrder.seller,
                type: 'ORDER_UPDATE',
                title: 'Both Ready! Pickup Scheduled 🚚',
                message: `Your partner is also ready! We have scheduled your pickup with Shiprocket.`,
                metadata: { referenceId: partnerOrder._id, imageUrl: partnerOrder.item.images?.[0] }
            });

            if (order.item && order.item.owner && order.item.owner.phone) {
                sendWhatsAppMessage(order.item.owner.phone, 'pickup_scheduled');
            }
            if (partnerOrder.item && partnerOrder.item.owner && partnerOrder.item.owner.phone) {
                sendWhatsAppMessage(partnerOrder.item.owner.phone, 'pickup_scheduled');
            }
          

            return res.status(200).json({
                success: true,
                message: 'Both parties are ready! Orders dispatched successfully. Shiprocket pickup scheduled.',
                data: order
            });
        } catch (dispatchErr) {
            await BarterRequest.updateOne(
                { _id: order.barterRequestRef }, 
                { $unset: { shiprocket_synced: "" } }
            );
            order.isReadyToDispatch = false;
            await order.save();
            
            console.error("Error dispatching barter pair:", dispatchErr);
            return res.status(400).json({ success: false, message: 'Failed to schedule pickup with Shiprocket. Please check dimensions or addresses.' });
        }
    } 
    
    const shiprocketRes = await processShiprocketAPI(order, item);
    order.trackingDetails = {
      shiprocket_order_id: shiprocketRes.order_id,
      shiprocket_shipment_id: shiprocketRes.shipment_id,
      awb_code: '', 
      courier_company: ''
    };
    
    order.orderStatus = 'processing';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order dispatched successfully. Shiprocket pickup scheduled.',
      data: order
    });

  } catch (error) {
    console.error('Error dispatching order:', error);
    let frontendMessage = 'Failed to dispatch order. Please try again.';
    try {
      let rawError = error.message;
      if (typeof rawError === 'string' && rawError.includes('{') && rawError.includes('}')) {
        const jsonStart = rawError.indexOf('{');
        const jsonEnd = rawError.lastIndexOf('}') + 1;
        const jsonString = rawError.substring(jsonStart, jsonEnd);
        const parsedError = JSON.parse(jsonString);
        if (typeof parsedError === 'object' && !Array.isArray(parsedError)) {
          const errorDetails = Object.values(parsedError).flat().join(' | ');
          frontendMessage = `Validation Error: ${errorDetails}`;
        } else {
          frontendMessage = rawError;
        }
      } else {
        frontendMessage = rawError || frontendMessage;
      }
    } catch (e) {
      frontendMessage = error.message || frontendMessage;
    }

    res.status(400).json({ success: false, message: frontendMessage });
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getShippingLabel = async (req, res) => {
  try {
    const { orderId } = req.params;
    let order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to download this label' });
    }
    if (!order.trackingDetails || !order.trackingDetails.shiprocket_shipment_id) {
       return res.status(400).json({ success: false, message: 'Shipment ID not found. Dispatch order first.' });
    }

    const shipmentId = order.trackingDetails.shiprocket_shipment_id;

    if (!order.trackingDetails.awb_code || order.trackingDetails.awb_code === '') {
       try {
           const awbData = await generateAWB(shipmentId);
           order.trackingDetails.awb_code = awbData.awb_code;
           order.trackingDetails.courier_company = awbData.courier_name;
           await schedulePickup(shipmentId);
           await order.save();
       } catch (awbError) {
           const errMsg = (awbError.message || '').toLowerCase();
  
           if (errMsg.includes('reassign') || errMsg.includes('17 hour') || errMsg.includes('already') || errMsg.includes('assigned')) {
               let recoveredAwb = null;
               
               if (order.trackingDetails.shiprocket_order_id) {
                   try {
                   
                       const srDetails = await getShiprocketOrderDetails(order.trackingDetails.shiprocket_order_id);
                       
                     
                       if (srDetails && srDetails.awb_code) {
                           recoveredAwb = srDetails.awb_code;
                       }
                   } catch (fetchErr) {
                       console.error("AWB Recovery API failed:", fetchErr);
                   }
               }
               
               if (recoveredAwb) {
                   order.trackingDetails.awb_code = recoveredAwb;
                   order.trackingDetails.courier_company = 'Courier Partner';
                   await order.save();
               } else {
                   return res.status(400).json({ 
                       success: false, 
                       message: 'Shiprocket is processing this courier assignment. Please check Shiprocket panel or try again in a few minutes.' 
                   });
               }
           } else {
               throw awbError;
           }
       }
    }

    let labelUrl = null;
    let labelAttempts = 0;
    let lastLabelError = null;
    
    while (!labelUrl && labelAttempts < 3) {
      try {
         labelUrl = await generateLabel(shipmentId);
         if (labelUrl) break;
      } catch (labelError) {
         lastLabelError = labelError;
         if (labelError.message.toLowerCase().includes('processing')) {
            await delay(2000); 
            labelAttempts++;
         } else {
            throw labelError; 
         }
      }
    }
    
    if (!labelUrl) {
      const apiErrMsg = lastLabelError ? lastLabelError.message : 'Label is not ready yet.';
      return res.status(400).json({ success: false, message: `${apiErrMsg} Try again in 1 minute.` });
    }

    res.status(200).json({ success: true, labelUrl, awb_code: order.trackingDetails.awb_code });

  } catch (error) {
     console.error('Error generating label:', error);
     res.status(500).json({ success: false, message: error.message || 'Server error generating label' });
  }
};



const handleShiprocketWebhook = async (req, res) => {
  try {
    const token = req.headers['x-api-key'];
    if (token !== process.env.SHIPROCKET_WEBHOOK_SECRET) {
      console.warn('Unauthorized webhook attempt blocked');
      return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }

    const { awb, current_status, etd, shipment_id } = req.body;
    
    if (!awb || !current_status) {
      return res.status(200).json({ success: true, message: 'Webhook endpoint is active.' });
    }

    let order = await Order.findOne({ 'trackingDetails.awb_code': awb }).populate('item');
    
    if (!order && shipment_id) {
      order = await Order.findOne({ 'trackingDetails.shiprocket_shipment_id': shipment_id }).populate('item');
      if (order) {
        order.trackingDetails.awb_code = awb;
        await order.save();
      }
    }

    if (!order) {
      return res.status(200).json({ success: true, message: 'Webhook received but order not found.' });
    }

    let setting = await CreditSetting.findOne();
    const auraRewardAmount = setting && setting.auraReward !== undefined ? setting.auraReward : 50;

    if (etd && order.trackingDetails) {
      if (etd.trim() !== '') {
        order.trackingDetails.expected_date = etd;
      }
    }
  
    if (current_status === 'DELIVERED' && order.orderStatus !== 'delivered') {
      order.orderStatus = 'delivered';
      order.updated_at = Date.now();

      if (order.isSellerPaid === false) {
        const seller = await User.findByIdAndUpdate(order.seller, {
          $inc: {
            account_credits: order.itemPrice,
            aura_points: auraRewardAmount
          }
        }, { new: true });
        
        if (seller) {
          order.isSellerPaid = true;

          const isBarter = order.orderType === 'barter';
          queueNotification({
            user: seller._id,
            type: 'CREDIT_ADDED',
            title: isBarter ? 'Swap Completed! 🎉' : 'Payment Released! 💰',
            message: isBarter 
              ? `Your barter item has been successfully delivered! +${auraRewardAmount} Aura points have been added.`
              : `Order successfully delivered! ${order.itemPrice} credits and +${auraRewardAmount} Aura have been credited to your account.`,
            metadata: { amount: order.itemPrice, reason: 'escrow_release', referenceId: order._id, imageUrl: order.item?.images?.[0] }
          });

          await AuraLog.create({
            user: seller._id,
            reason: "Successful Trade Delivered",
            points: auraRewardAmount,
            type: "positive"
          });

          if(order.item) {
             order.item.status = 'swapped';
             await order.item.save();
          }
        }
      }
      await order.save();
    } 
    else if (current_status === 'IN TRANSIT' && (order.orderStatus === 'processing' || order.orderStatus === 'shipped')) {
      order.orderStatus = 'in_transit';
      await order.save(); 
    } 
    else if (current_status === 'SHIPPED' && order.orderStatus === 'processing') {
      order.orderStatus = 'shipped';
      await order.save(); 
    } 
    else {
      await order.save();
    }

    res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Shiprocket Webhook Error:', error);
    res.status(200).json({ success: false, message: 'Server error processing webhook' });
  }
};

const autoCancelOverdueOrders = async () => {
  try {
    let setting = await CreditSetting.findOne();
    const cancelHours = setting && setting.autoCancelHours ? setting.autoCancelHours : 24;
    const auraPenaltyAmount = setting && setting.auraPenalty !== undefined ? setting.auraPenalty : 50;
    
    const cancelThreshold = new Date(Date.now() - cancelHours * 60 * 60 * 1000);

    const overdueOrderDocs = await Order.find({
      orderStatus: 'pending',
      created_at: { $lt: cancelThreshold }
    }).select('_id');

    if (overdueOrderDocs.length === 0) return;

    const overdueOrderIds = overdueOrderDocs.map(doc => doc._id);
    const batchSize = 50;

    for (let i = 0; i < overdueOrderIds.length; i += batchSize) {
      const batchIds = overdueOrderIds.slice(i, i + batchSize);
      
      const ordersBatch = await Order.find({ _id: { $in: batchIds } })
        .populate('buyer seller item');

      for (const order of ordersBatch) {
        try {
          if (order.orderType === 'barter' && order.barterRequestRef) {
              continue; 
          }

          order.orderStatus = 'cancelled';
          order.cancellationReason = `System Auto-Cancel: Seller failed to dispatch within ${cancelHours} hours.`;
          
          let newPaymentStatus = 'refunded';

          if (order.shippingCost > 0 && order.razorpay_payment_id) {
            const refundRes = await refundRazorpayPayment(order.razorpay_payment_id, order.shippingCost);
            if (refundRes.success) {
               await Transaction.create({
                 user: order.buyer._id, 
                 amount: order.shippingCost,
                 razorpay_order_id: order.razorpay_order_id,
                 razorpay_payment_id: order.razorpay_payment_id,
                 status: 'success',
                 transactionType: 'shipping_refund'
               });
               newPaymentStatus = 'refund_processing'; 
            }
          }

          order.paymentStatus = newPaymentStatus;

          await order.save({ validateBeforeSave: false });

          const buyerId = order.buyer._id;
          await User.findByIdAndUpdate(buyerId, {
            $inc: { account_credits: order.itemPrice }
          });
          await Transaction.create({
            user: buyerId,
            amount: order.itemPrice,
            status: 'success',
            transactionType: 'order_refund'
          });
          
          const sellerId = order.seller._id;
          await User.findByIdAndUpdate(sellerId, [
            {
              $set: {
                aura_points: {
                  $max: [0, { $subtract: [{ $ifNull: ["$aura_points", 0] }, auraPenaltyAmount] }]
                }
              }
            }
          ]);

          queueNotification({
            user: buyerId,
            type: 'CREDIT_ADDED',
            title: 'Order Auto-Cancelled & Refunded 🔄',
            message: `The seller failed to dispatch your order on time. Your ${order.itemPrice} credits have been refunded.`,
            metadata: { amount: order.itemPrice, reason: 'auto_cancel_refund', referenceId: order._id, imageUrl: order.item?.images?.[0] }
          });

        
          if (order.buyer && order.buyer.phone) {
              sendWhatsAppMessage(order.buyer.phone, 'order_cancelled_refunded');
          }
         

          await AuraLog.create({
            user: sellerId,
            reason: "Auto-cancelled: Failed to dispatch order on time",
            points: -auraPenaltyAmount,
            type: "negative"
          });

          queueNotification({
            user: sellerId,
            type: 'AURA_UPDATE',
            title: 'Aura Penalty ⚠️',
            message: `${auraPenaltyAmount} Aura points deducted. You failed to dispatch the order within ${cancelHours} hours.`,
            metadata: { reason: 'auto_cancel_penalty', referenceId: order._id, imageUrl: order.item?.images?.[0] }
          });

          if (order.item) {
            order.item.status = 'active';
            await order.item.save();
          }
        } catch (innerError) {
          console.error(`Failed to process auto-cancel for order ${order._id}:`, innerError);
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
};

const getLiveTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    if (order.buyer.toString() !== req.user._id.toString() && order.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view tracking for this order' });
    }

    if (!order.trackingDetails || !order.trackingDetails.awb_code) {
      return res.status(400).json({ success: false, message: 'AWB code not available yet. Tracking cannot be fetched.' });
    }

    const trackingData = await getTrackingByAWB(order.trackingDetails.awb_code);
    
    res.status(200).json({
      success: true,
      data: trackingData
    });

  } catch (error) {
    console.error('Error fetching live tracking:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error fetching tracking' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('item', 'title images category condition weight dimensions') 
      .populate('buyer', 'full_name email phone')
      .populate('seller', 'full_name email phone')
      
      .populate('barterRequestRef', 'first_dispatch_at status');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.buyer._id.toString() !== req.user._id.toString() && 
        order.seller._id.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    res.status(500).json({ success: false, message: 'Server error fetching order details' });
  }
};

module.exports = {
  calculateShippingCost, 
  createOrder,
  getMyOrders,
  getSellerOrders,
  updateOrderStatus,
  dispatchOrder, 
  getShippingLabel, 
  handleShiprocketWebhook,
  autoCancelOverdueOrders,
  getLiveTracking ,
  getOrderById
};
const Order = require('../models/Order');
const Item = require('../models/Item');
const User = require('../models/User');
const CreditSetting = require('../models/CreditSetting');
const Transaction = require('../models/Transaction'); 
const crypto = require('crypto'); 
// -> CHANGE: Imported getTrackingByAWB
const { checkServiceability, createShiprocketOrder, addPickupLocation, generateAWB, generateLabel, schedulePickup, getTrackingByAWB } = require('../utils/shiprocket'); 
const Notification = require('../models/Notification');
const AuraLog = require('../models/AuraLog'); 

// -> NAYA CHANGE START: Imported refund function
const { refundRazorpayPayment } = require('./paymentController');
// -> NAYA CHANGE END

const calculateShippingCost = async (req, res) => {
  try {
    const { itemId, pincode } = req.body;
    
    const item = await Item.findById(itemId).populate('owner');
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    let setting = await CreditSetting.findOne();
    let finalCost = 60; // default fallback

    if (setting) {
      if (setting.shippingMethod === 'dynamic') {
        
        const pickupPincode = item.owner.pickupAddress?.pincode;
        if (!pickupPincode) {
          return res.status(400).json({ success: false, message: 'Seller pickup pincode missing.' });
        }
        
        const weight = item.weight || 0.5;
        
        const dimensions = item.dimensions || { length: 10, width: 10, height: 10 }; 
        
        finalCost = await checkServiceability(pickupPincode, pincode, weight, dimensions);
      } else {
        // Flat rate
        finalCost = setting.flatShippingCost !== undefined ? setting.flatShippingCost : 60;
      }
    }

    res.status(200).json({ success: true, shippingCost: finalCost });
  } catch (error) {
    console.error('Error calculating shipping:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error calculating shipping' });
  }
};

const createOrder = async (req, res) => {
  try {
    const { itemId, shippingAddress, paymentDetails } = req.body;
    const buyerId = req.user._id;

    const item = await Item.findById(itemId).populate('owner');
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
    let shippingCost = 60; 

    if (setting) {
      if (setting.shippingMethod === 'dynamic') {
        const pickupPincode = item.owner.pickupAddress?.pincode;
        const weight = item.weight || 0.5;
        const dimensions = item.dimensions || { length: 10, width: 10, height: 10 };
        
        shippingCost = await checkServiceability(pickupPincode, shippingAddress.pincode, weight, dimensions);
      } else {
        shippingCost = setting.flatShippingCost !== undefined ? setting.flatShippingCost : 60;
      }
    }

    let razorpay_order_id, razorpay_payment_id;

    if (shippingCost > 0) {
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
      
      const newTransaction = new Transaction({
        user: buyerId,
        amount: shippingCost, 
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

    buyer.account_credits -= itemPrice;

    
    if (!buyer.savedAddresses) buyer.savedAddresses = [];
    const isAddressExist = buyer.savedAddresses.some(addr => 
      addr.houseNo === shippingAddress.houseNo && 
      addr.pincode === shippingAddress.pincode
    );

    if (!isAddressExist) {
      buyer.savedAddresses.push(shippingAddress);
    }

    await buyer.save();

    item.status = 'reserved'; 
    await item.save();

    const order = await Order.create({
      buyer: buyerId,
      seller: item.owner._id,
      item: itemId,
      itemPrice: itemPrice,
      shippingCost: shippingCost,
      totalAmount: itemPrice + shippingCost, 
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

    await Notification.create({
      user: buyerId,
      type: 'CREDIT_DEDUCTED',
      title: 'Order Confirmed! 🛒',
      message: `You have successfully purchased "${item.title}". ${itemPrice} credits were deducted.`,
      metadata: { amount: itemPrice, reason: 'item_purchase', referenceId: order._id }
    });

    await Notification.create({
      user: item.owner._id,
      type: 'ORDER_UPDATE',
      title: 'New Order Received! 🎉',
      message: `Someone has purchased your item "${item.title}". Please pack the item!`,
      metadata: { referenceId: order._id }
    });

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
      const seller = await User.findById(order.seller);
      if (seller) {
        seller.account_credits += order.itemPrice; 
        seller.aura_points = (seller.aura_points || 0) + auraRewardAmount; 
        await seller.save();
        
        order.isSellerPaid = true;

        await Notification.create({
          user: seller._id,
          type: 'CREDIT_ADDED',
          title: 'Payment Released! 💰',
          message: `Order delivered! ${order.itemPrice} credits and +${auraRewardAmount} Aura have been added to your wallet.`,
          metadata: { amount: order.itemPrice, reason: 'escrow_release', referenceId: order._id }
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
      const buyer = await User.findById(order.buyer);
      if (buyer) {
        buyer.account_credits += order.itemPrice;
        await buyer.save();

        // -> NAYA CHANGE START: Save Credits Refund Transaction
        await Transaction.create({
          user: buyer._id,
          amount: order.itemPrice,
          status: 'success',
          transactionType: 'order_refund'
        });
        
        // Refund shipping money via Razorpay
        if (order.shippingCost > 0 && order.razorpay_payment_id) {
          const refundRes = await refundRazorpayPayment(order.razorpay_payment_id, order.shippingCost);
          if (!refundRes.success) {
            console.error('Failed to process Razorpay refund for order:', order._id);
          } else {
            // Log shipping refund transaction if successful
            await Transaction.create({
              user: buyer._id,
              amount: order.shippingCost,
              razorpay_order_id: order.razorpay_order_id,
              razorpay_payment_id: order.razorpay_payment_id,
              status: 'success',
              transactionType: 'shipping_refund'
            });
          }
        }
        // -> NAYA CHANGE END

        order.paymentStatus = 'refunded';

        await Notification.create({
          user: buyer._id,
          type: 'CREDIT_ADDED',
          title: 'Order Cancelled & Refunded 🔄',
          message: `The order has been cancelled. Reason: ${order.cancellationReason}. Your ${order.itemPrice} credits have been refunded.`,
          metadata: { amount: order.itemPrice, reason: 'order_refund', referenceId: order._id }
        });
        
        const seller = await User.findById(order.seller);
        if (seller) {
          seller.aura_points = Math.max(0, (seller.aura_points || 0) - auraPenaltyAmount); 
          await seller.save();

          await AuraLog.create({
            user: seller._id,
            reason: "Cancelled deal after accepting",
            points: -auraPenaltyAmount,
            type: "negative"
          });

          await Notification.create({
            user: seller._id,
            type: 'AURA_UPDATE', 
            title: 'Aura Penalty ⚠️',
            message: `${auraPenaltyAmount} Aura points have been deducted due to the cancelled deal.`,
            metadata: { reason: 'aura_penalty', referenceId: order._id }
          });
        }

        if(order.item) {
           order.item.status = 'active';
           await order.item.save();
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

const dispatchOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { weight, length, width, height } = req.body;

    const order = await Order.findById(orderId).populate({
      path: 'item', populate: { path: 'owner' }
    }).populate('buyer');
    
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to dispatch this order' });
    }
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending orders can be dispatched' });
    }

    const item = order.item;
    const buyer = order.buyer;
    const shippingAddress = order.shippingAddress;
    const itemPrice = order.itemPrice;

    const dynamicPickupLocation = await addPickupLocation(item.owner);
    const orderDate = new Date().toISOString().slice(0, 19).replace('T', ' '); 
    
    let cleanPhone = shippingAddress.phone.replace(/\D/g, ''); 
    if (cleanPhone.length > 10) cleanPhone = cleanPhone.slice(-10);

    const shiprocketPayload = {
      order_id: order._id.toString(), 
      order_date: orderDate,
      pickup_location: dynamicPickupLocation, 
      channel_id: "", 
      billing_customer_name: shippingAddress.fullName,
      billing_last_name: "User", 
      billing_address: `${shippingAddress.houseNo}, ${shippingAddress.areaStreet}`,
      billing_address_2: shippingAddress.landmark || "",
      billing_city: shippingAddress.city,
      billing_pincode: shippingAddress.pincode,
      billing_state: shippingAddress.state,
      billing_country: "India",
      billing_email: buyer.email,
      billing_phone: cleanPhone,
      shipping_is_billing: true,
      order_items: [
        {
          name: item.title,
          sku: item._id.toString(),
          units: 1,
          selling_price: itemPrice > 0 ? itemPrice : 100, 
          discount: 0,
          tax: 0,
          hsn: ""
        }
      ],
      payment_method: "Prepaid",
      sub_total: itemPrice > 0 ? itemPrice : 100,
      length: length || item.dimensions?.length || 10,
      breadth: width || item.dimensions?.width || 10,
      height: height || item.dimensions?.height || 10,
      weight: weight || item.weight || 0.5
    };

    const shiprocketRes = await createShiprocketOrder(shiprocketPayload);
    
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

    // CHANGED: Yahan JSON error ko parse karke theek message nikal rahe hain
    let frontendMessage = 'Failed to dispatch order. Please try again.';

    try {
      let rawError = error.message;

      if (typeof rawError === 'string' && rawError.includes('{') && rawError.includes('}')) {
        const jsonStart = rawError.indexOf('{');
        const jsonEnd = rawError.lastIndexOf('}') + 1;
        const jsonString = rawError.substring(jsonStart, jsonEnd);
        
        const parsedError = JSON.parse(jsonString);
        
        if (typeof parsedError === 'object' && !Array.isArray(parsedError)) {
          // Object ke errors nikal kar array banayega
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


const getShippingLabel = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to download this label' });
    }
    if (!order.trackingDetails || !order.trackingDetails.shiprocket_shipment_id) {
       return res.status(400).json({ success: false, message: 'Shipment ID not found. Dispatch order first.' });
    }

    const shipmentId = order.trackingDetails.shiprocket_shipment_id;

    if (!order.trackingDetails.awb_code || order.trackingDetails.awb_code === '') {
       const awbData = await generateAWB(shipmentId);
       order.trackingDetails.awb_code = awbData.awb_code;
       order.trackingDetails.courier_company = awbData.courier_name;
       await schedulePickup(shipmentId);
       await order.save();
    }

    const labelUrl = await generateLabel(shipmentId);
    
    if (!labelUrl) {
      return res.status(400).json({ success: false, message: 'Label is not ready yet. Try again later.' });
    }

    res.status(200).json({ success: true, labelUrl, awb_code: order.trackingDetails.awb_code });

  } catch (error) {
     console.error('Error generating label:', error);
     res.status(500).json({ success: false, message: error.message || 'Server error generating label' });
  }
};


const handleShiprocketWebhook = async (req, res) => {
  try {
    // -> NAYA CODE: Security check
    const token = req.headers['x-api-key'];
    if (token !== process.env.SHIPROCKET_WEBHOOK_SECRET) {
      console.warn('Unauthorized webhook attempt blocked');
      return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }

    const { awb, current_status } = req.body;
    
    // Test ping from Shiprocket
    if (!awb || !current_status) {
      return res.status(200).json({ success: true, message: 'Webhook endpoint is active.' });
    }

    const order = await Order.findOne({ 'trackingDetails.awb_code': awb }).populate('item');
    
    // Test fake AWB ping from Shiprocket
    if (!order) {
      console.log(`Shiprocket test ping or invalid AWB received: ${awb}`);
      return res.status(200).json({ success: true, message: 'Webhook received but order not found.' });
    }

    let setting = await CreditSetting.findOne();
    const auraRewardAmount = setting && setting.auraReward !== undefined ? setting.auraReward : 50;

    if (current_status === 'DELIVERED' && order.orderStatus !== 'delivered') {
      order.orderStatus = 'delivered';
      order.updated_at = Date.now();

      if (order.isSellerPaid === false) {
        const seller = await User.findById(order.seller);
        if (seller) {
          seller.account_credits += order.itemPrice; 
          seller.aura_points = (seller.aura_points || 0) + auraRewardAmount; 
          await seller.save();
          
          order.isSellerPaid = true;

          await Notification.create({
            user: seller._id,
            type: 'CREDIT_ADDED',
            title: 'Payment Released! 💰',
            message: `Order successfully delivered! ${order.itemPrice} credits and +${auraRewardAmount} Aura have been credited to your account.`,
            metadata: { amount: order.itemPrice, reason: 'escrow_release', referenceId: order._id }
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
    else if ((current_status === 'SHIPPED' || current_status === 'IN TRANSIT') && order.orderStatus === 'processing') {
      order.orderStatus = 'shipped';
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

    const overdueOrders = await Order.find({
      orderStatus: 'pending',
      created_at: { $lt: cancelThreshold }
    }).populate('buyer seller item');

    for (const order of overdueOrders) {
      order.orderStatus = 'cancelled';
      order.cancellationReason = `System Auto-Cancel: Seller failed to dispatch within ${cancelHours} hours.`;
      
      // -> NAYA CHANGE START: Refund shipping money via Razorpay on auto-cancel
      if (order.shippingCost > 0 && order.razorpay_payment_id) {
        const refundRes = await refundRazorpayPayment(order.razorpay_payment_id, order.shippingCost);
        if (!refundRes.success) {
          console.error('Failed to process Razorpay refund for auto-cancelled order:', order._id);
        } else {
           // Log shipping refund transaction if successful
           await Transaction.create({
             user: order.buyer._id, 
             amount: order.shippingCost,
             razorpay_order_id: order.razorpay_order_id,
             razorpay_payment_id: order.razorpay_payment_id,
             status: 'success',
             transactionType: 'shipping_refund'
           });
        }
      }
      // -> NAYA CHANGE END

      order.paymentStatus = 'refunded';

      await order.save({ validateBeforeSave: false });

      const buyer = order.buyer;
      buyer.account_credits += order.itemPrice;
      await buyer.save();

      // -> NAYA CHANGE START: Save Credits Refund Transaction for Auto-Cancel
      await Transaction.create({
        user: buyer._id,
        amount: order.itemPrice,
        status: 'success',
        transactionType: 'order_refund'
      });
      // -> NAYA CHANGE END

      await Notification.create({
        user: buyer._id,
        type: 'CREDIT_ADDED',
        title: 'Order Auto-Cancelled & Refunded 🔄',
        message: `The seller failed to dispatch your order on time. Your ${order.itemPrice} credits have been refunded.`,
        metadata: { amount: order.itemPrice, reason: 'auto_cancel_refund', referenceId: order._id }
      });

      const seller = order.seller;
      seller.aura_points = Math.max(0, (seller.aura_points || 0) - auraPenaltyAmount);
      await seller.save();

      await AuraLog.create({
        user: seller._id,
        reason: "Auto-cancelled: Failed to dispatch order on time",
        points: -auraPenaltyAmount,
        type: "negative"
      });

      await Notification.create({
        user: seller._id,
        type: 'AURA_UPDATE',
        title: 'Aura Penalty ⚠️',
        message: `${auraPenaltyAmount} Aura points deducted. You failed to dispatch the order within ${cancelHours} hours.`,
        metadata: { reason: 'auto_cancel_penalty', referenceId: order._id }
      });

      if (order.item) {
        order.item.status = 'active';
        await order.item.save();
      }
    }
  } catch (error) {
    console.error(error);
  }
};

// -> CHANGES START HERE: Added getLiveTracking function
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
      .populate('seller', 'full_name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Security check: Sirf buyer, seller ya admin hi order details dekh paye
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
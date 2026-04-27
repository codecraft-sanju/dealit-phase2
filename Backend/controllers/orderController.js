const Order = require('../models/Order');
const Item = require('../models/Item');
const User = require('../models/User');
const CreditSetting = require('../models/CreditSetting');
const Transaction = require('../models/Transaction'); 
const crypto = require('crypto'); 
const { checkServiceability, createShiprocketOrder, addPickupLocation } = require('../utils/shiprocket');
const Notification = require('../models/Notification');
const AuraLog = require('../models/AuraLog'); 

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

// 1. CREATE ORDER (Buy Now via Credits + Real Money Shipping)
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

    // 2. Fetch Settings aur Cost dubara calculate karo fraud rokne ke liye
    let setting = await CreditSetting.findOne();
    let shippingCost = 60; // default

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

    // --- STEP 1: Verify Razorpay Payment for Shipping (Only if shipping is not free) ---
    if (shippingCost > 0) {
      if (!paymentDetails || !paymentDetails.razorpay_payment_id) {
        return res.status(400).json({ success: false, message: 'Shipping payment details missing' });
      }

      razorpay_order_id = paymentDetails.razorpay_order_id;
      razorpay_payment_id = paymentDetails.razorpay_payment_id;
      const { razorpay_signature } = paymentDetails;

      // Signature verify karna (Security check)
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

    // 4. Check Buyer's Wallet Balance (ONLY FOR ITEM PRICE)
    const buyer = await User.findById(buyerId);
    if (buyer.account_credits < itemPrice) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient credits. You need ${itemPrice} credits for this item.`,
        requiredCredits: itemPrice,
        currentCredits: buyer.account_credits
      });
    }

    // 5. Deduct Credits from Buyer (ONLY ITEM PRICE)
    buyer.account_credits -= itemPrice;
    await buyer.save();

    // 6. Update Item Status so nobody else can buy it
    item.status = 'reserved'; 
    await item.save();

    // 7. Create the Order in MongoDB
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

    try {
      const dynamicPickupLocation = await addPickupLocation(item.owner);

      const orderDate = new Date().toISOString().slice(0, 19).replace('T', ' '); 
      const weight = item.weight || 0.5;
      const dimensions = item.dimensions || { length: 10, width: 10, height: 10 };
      
      const shiprocketPayload = {
        order_id: order._id.toString(), 
        order_date: orderDate,
        pickup_location: dynamicPickupLocation, 
        channel_id: "", 
        billing_customer_name: shippingAddress.fullName,
        billing_last_name: "User", 
        billing_address: shippingAddress.addressLine,
        billing_city: shippingAddress.city,
        billing_pincode: shippingAddress.pincode,
        billing_state: shippingAddress.state,
        billing_country: "India",
        billing_email: buyer.email,
        billing_phone: shippingAddress.phone,
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
        length: dimensions.length,
        breadth: dimensions.width,
        height: dimensions.height,
        weight: weight
      };

      const shiprocketRes = await createShiprocketOrder(shiprocketPayload);
      
      // Update our order with Shiprocket Details
      order.trackingDetails = {
        shiprocket_order_id: shiprocketRes.order_id,
        shiprocket_shipment_id: shiprocketRes.shipment_id,
        awb_code: '', 
        courier_company: ''
      };
      await order.save();

    } catch (shiprocketError) {
      console.error("Order saved but failed to push to Shiprocket:", shiprocketError);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Credits deducted and shipping processed.',
      data: order
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Server error during checkout' });
  }
};

// 2. GET BUYER ORDERS (Purchase History)
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

// 3. GET SELLER ORDERS (Sales History to fulfill)
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

// 4. UPDATE ORDER STATUS (Escrow Logic Release)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; 

    const order = await Order.findById(orderId).populate('item');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Security: Only Admin or Seller should update status
    if (order.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    order.orderStatus = status;
    order.updated_at = Date.now();

    // --- ESCROW RELEASE LOGIC ---
    if (status === 'delivered' && order.isSellerPaid === false) {
      const seller = await User.findById(order.seller);
      if (seller) {
        seller.account_credits += order.itemPrice; 
        
        // ⚡ NAYA CHANGE: Aura Increase for Successful Trade
        seller.aura_points = (seller.aura_points || 0) + 50; 
        
        await seller.save();
        
        order.isSellerPaid = true;

        await Notification.create({
          user: seller._id,
          type: 'CREDIT_ADDED',
          title: 'Payment Released! 💰',
          message: `Order delivered! ${order.itemPrice} credits and +50 Aura have been added to your wallet.`,
          metadata: { amount: order.itemPrice, reason: 'escrow_release', referenceId: order._id }
        });

        // ⚡ NAYA CHANGE: Log creation for Aura
        await AuraLog.create({
          user: seller._id,
          reason: "Successful Trade Delivered",
          points: 50,
          type: "positive"
        });

        if(order.item) {
           order.item.status = 'swapped';
           await order.item.save();
        }
      }
    }

    // --- CANCELLATION REFUND LOGIC ---
    if (status === 'cancelled' && order.paymentStatus === 'paid') {
      const buyer = await User.findById(order.buyer);
      if (buyer) {
        // Refund only the item credits
        buyer.account_credits += order.itemPrice;
        await buyer.save();
        
        order.paymentStatus = 'refunded';

        await Notification.create({
          user: buyer._id,
          type: 'CREDIT_ADDED',
          title: 'Order Cancelled & Refunded 🔄',
          message: `The order has been cancelled. Your ${order.itemPrice} credits have been refunded.`,
          metadata: { amount: order.itemPrice, reason: 'order_refund', referenceId: order._id }
        });
        
        // ⚡ NAYA CHANGE: Penalty to Seller for Cancelled Deal
        const seller = await User.findById(order.seller);
        if (seller) {
          seller.aura_points = Math.max(0, (seller.aura_points || 0) - 50); // Optional: Math.max ensures it doesn't drop below 0
          await seller.save();

          await AuraLog.create({
            user: seller._id,
            reason: "Cancelled deal after accepting",
            points: -50,
            type: "negative"
          });

          await Notification.create({
            user: seller._id,
            type: 'AURA_UPDATE', 
            title: 'Aura Penalty ⚠️',
            message: `50 Aura points have been deducted due to the cancelled deal.`,
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

// Shiprocket Webhook Handler
const handleShiprocketWebhook = async (req, res) => {
  try {
    const { awb, current_status } = req.body;

    if (!awb || !current_status) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    // Find order by AWB code
    const order = await Order.findOne({ 'trackingDetails.awb_code': awb }).populate('item');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // If Shiprocket status is DELIVERED
    if (current_status === 'DELIVERED' && order.orderStatus !== 'delivered') {
      order.orderStatus = 'delivered';
      order.updated_at = Date.now();

      // --- ESCROW RELEASE LOGIC (Automatic) ---
      if (order.isSellerPaid === false) {
        const seller = await User.findById(order.seller);
        if (seller) {
          seller.account_credits += order.itemPrice; 
          
          // ⚡ NAYA CHANGE: Auto Aura Increase from Webhook
          seller.aura_points = (seller.aura_points || 0) + 50; 

          await seller.save();
          
          order.isSellerPaid = true;

          await Notification.create({
            user: seller._id,
            type: 'CREDIT_ADDED',
            title: 'Payment Released! 💰',
            message: `Order successfully delivered! ${order.itemPrice} credits and +50 Aura have been credited to your account.`,
            metadata: { amount: order.itemPrice, reason: 'escrow_release', referenceId: order._id }
          });

          // ⚡ NAYA CHANGE: Log creation for Aura
          await AuraLog.create({
            user: seller._id,
            reason: "Successful Trade Delivered",
            points: 50,
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
    // Status update for SHIPPED or IN TRANSIT
    else if ((current_status === 'SHIPPED' || current_status === 'IN TRANSIT') && order.orderStatus === 'processing') {
      order.orderStatus = 'shipped';
      await order.save();
    }

    // Must return 200 OK so Shiprocket knows we received it
    res.status(200).json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Shiprocket Webhook Error:', error);
    res.status(500).json({ success: false, message: 'Server error processing webhook' });
  }
};

module.exports = {
  calculateShippingCost, 
  createOrder,
  getMyOrders,
  getSellerOrders,
  updateOrderStatus,
  handleShiprocketWebhook 
};
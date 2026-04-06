const Order = require('../models/Order');
const Item = require('../models/Item');
const User = require('../models/User');
const CreditSetting = require('../models/CreditSetting');

// 1. CREATE ORDER (Buy Now via Credits)
const createOrder = async (req, res) => {
  try {
    const { itemId, shippingAddress } = req.body;
    const buyerId = req.user._id;

    // 1. Check Item details
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    if (item.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This item is no longer available for sale' });
    }
    if (item.owner.toString() === buyerId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot buy your own item' });
    }

    // 2. Fetch Shipping Cost from Admin Settings
    let setting = await CreditSetting.findOne();
    const shippingCost = setting && setting.flatShippingCost !== undefined ? setting.flatShippingCost : 60;
    const itemPrice = item.estimated_value || 0;
    const totalAmount = itemPrice + shippingCost;

    // 3. Check Buyer's Wallet Balance
    const buyer = await User.findById(buyerId);
    if (buyer.account_credits < totalAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient credits. You need ${totalAmount} credits (Item: ${itemPrice} + Shipping: ${shippingCost}).`,
        requiredCredits: totalAmount,
        currentCredits: buyer.account_credits
      });
    }

    // 4. Deduct Credits from Buyer (Escrow Hold)
    buyer.account_credits -= totalAmount;
    await buyer.save();

    // 5. Update Item Status so nobody else can buy it
    item.status = 'reserved'; 
    await item.save();

    // 6. Create the Order
    const order = await Order.create({
      buyer: buyerId,
      seller: item.owner,
      item: itemId,
      itemPrice: itemPrice,
      shippingCost: shippingCost,
      totalAmount: totalAmount,
      shippingAddress: shippingAddress,
      orderStatus: 'pending',
      paymentStatus: 'paid', // Kyunki credits cut chuke hain
      isSellerPaid: false    // Seller ko abhi paise nahi mile hain
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Credits deducted.',
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
    // status can be: 'processing', 'shipped', 'delivered', 'cancelled'

    const order = await Order.findById(orderId).populate('item');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Security: Only Admin or Seller should update status (You can refine this later)
    if (order.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    order.orderStatus = status;
    order.updated_at = Date.now();

    // --- ESCROW RELEASE LOGIC ---
    // Agar order deliver ho gaya aur seller ko paise ab tak nahi mile
    if (status === 'delivered' && order.isSellerPaid === false) {
      const seller = await User.findById(order.seller);
      if (seller) {
        // Sirf Item ki price seller ko milegi. Shipping platform rakhega (ya as per your business logic)
        seller.account_credits += order.itemPrice; 
        await seller.save();
        
        order.isSellerPaid = true;

        // Item ka status permanently 'swapped' (ya sold) kar do
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
        // Refund full amount to buyer
        buyer.account_credits += order.totalAmount;
        await buyer.save();
        
        order.paymentStatus = 'refunded';
        
        // Item wapas active kar do
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

module.exports = {
  createOrder,
  getMyOrders,
  getSellerOrders,
  updateOrderStatus
};
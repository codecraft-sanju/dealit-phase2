const Item = require('../models/Item');
const User = require('../models/User'); 
const CreditSetting = require('../models/CreditSetting'); 
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const BarterRequest = require('../models/BarterRequest');

const getPendingItems = async (req, res) => {
  try {
    const items = await Item.find({ status: 'pending' }).populate('owner', 'full_name email phone').sort({ created_at: -1 });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('user', 'full_name email phone profilePic')
      .sort({ created_at: -1 });

    const totalIncome = transactions.reduce((sum, txn) => {
      if (txn.status === 'success') {
        return sum + txn.amount;
      }
      return sum;
    }, 0);

    res.status(200).json({ 
      success: true, 
      totalIncome: totalIncome,
      count: transactions.length, 
      data: transactions 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error fetching transactions' });
  }
};

const updateItemStatus = async (req, res) => {
  try {
    const { status, rejection_reason } = req.body; 
    if (!['pending', 'active', 'rejected', 'reserved', 'swapped'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const wasAlreadyActive = item.status === 'active';

    item.status = status;
    item.updated_at = Date.now();
    
    if (status === 'rejected') {
      item.rejection_reason = rejection_reason || 'No reason provided by admin.';
    } else {
      item.rejection_reason = ''; 
    }

    await item.save();

    if (status === 'active' && !wasAlreadyActive) {
      let setting = await CreditSetting.findOne();
      if (!setting) {
        setting = { isCreditSystemEnabled: true, creditsPerListing: 50, maxListingsRewarded: 3 };
      }

      if (setting.isCreditSystemEnabled) {
      
        const activeItemsCount = await Item.countDocuments({ owner: item.owner, status: 'active' });

        if (activeItemsCount <= setting.maxListingsRewarded) {
          const user = await User.findById(item.owner);
          if (user) {
            user.account_credits += setting.creditsPerListing;
            await user.save();
          }
        }
      }
    }

    await item.populate('owner', 'full_name email');

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAllItems = async (req, res) => {
  try {
    const items = await Item.find({}).populate('owner', 'full_name email phone').sort({ created_at: -1 });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ created_at: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role provided' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: role, updated_at: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ 
      success: true, 
      message: `User role updated to ${role} successfully`, 
      data: user 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    }

    await user.deleteOne();
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getCreditSettings = async (req, res) => {
  try {
    let setting = await CreditSetting.findOne();
    if (!setting) {
      setting = await CreditSetting.create({});
    }
    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateCreditSettings = async (req, res) => {
  try {
    const { 
      isCreditSystemEnabled, 
      creditsPerListing, 
      maxListingsRewarded, 
      maxAllowedListings,
      isWelcomeBonusEnabled, 
      welcomeBonusAmount,    
      shippingMethod,        
      flatShippingCost,      
      isReferralSystemEnabled,
      referralRewardCredits,
      maxReferralLimit,
      milestoneReferralReward
    } = req.body;
    
    let setting = await CreditSetting.findOne();
    if (!setting) {
      setting = new CreditSetting({});
    }

    if (isCreditSystemEnabled !== undefined) setting.isCreditSystemEnabled = isCreditSystemEnabled;
    if (creditsPerListing !== undefined) setting.creditsPerListing = creditsPerListing;
    if (maxListingsRewarded !== undefined) setting.maxListingsRewarded = maxListingsRewarded;
    if (maxAllowedListings !== undefined) setting.maxAllowedListings = maxAllowedListings;
    
    if (isWelcomeBonusEnabled !== undefined) setting.isWelcomeBonusEnabled = isWelcomeBonusEnabled;
    if (welcomeBonusAmount !== undefined) setting.welcomeBonusAmount = welcomeBonusAmount;
  
    if (shippingMethod !== undefined) setting.shippingMethod = shippingMethod;
    if (flatShippingCost !== undefined) setting.flatShippingCost = flatShippingCost;

    if (isReferralSystemEnabled !== undefined) setting.isReferralSystemEnabled = isReferralSystemEnabled;
    if (referralRewardCredits !== undefined) setting.referralRewardCredits = referralRewardCredits;
    
    if (maxReferralLimit !== undefined) setting.maxReferralLimit = maxReferralLimit;
    if (milestoneReferralReward !== undefined) setting.milestoneReferralReward = milestoneReferralReward;
    
    setting.updated_at = Date.now();

    await setting.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Credit settings successfully update ho gayi hain', 
      data: setting 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getPublicCreditSettings = async (req, res) => {
  try {
    let setting = await CreditSetting.findOne().select(
      'isReferralSystemEnabled referralRewardCredits maxAllowedListings maxReferralLimit milestoneReferralReward isWelcomeBonusEnabled welcomeBonusAmount shippingMethod flatShippingCost'
    );
    
    if (!setting) {
      setting = { 
        isReferralSystemEnabled: true, 
        referralRewardCredits: 40, 
        maxAllowedListings: 5,
        maxReferralLimit: 5,
        milestoneReferralReward: 100,
        isWelcomeBonusEnabled: true, 
        welcomeBonusAmount: 50,
        shippingMethod: 'flat', 
        flatShippingCost: 60
      };
    }
    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// <-- NAYA CHANGE: Admin ke liye saare orders fetch karne ka function -->
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('buyer', 'full_name email phone city pickupAddress')
      .populate('seller', 'full_name email phone city pickupAddress')
      .populate('item', 'title images estimated_value category condition')
      .sort({ created_at: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Error fetching all orders for admin:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching orders' });
  }
};

// <-- NAYA CHANGE: Admin manually order status aur tracking update kar sake -->
const updateAdminOrderStatus = async (req, res) => {
  try {
    const { orderStatus, awb_code, courier_company } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId).populate('item');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
    }

    if (awb_code !== undefined) order.trackingDetails.awb_code = awb_code;
    if (courier_company !== undefined) order.trackingDetails.courier_company = courier_company;

    order.updated_at = Date.now();

    if (orderStatus === 'delivered' && order.isSellerPaid === false) {
      const seller = await User.findById(order.seller);
      if (seller) {
        seller.account_credits += order.itemPrice;
        await seller.save();
        order.isSellerPaid = true;

        if (order.item) {
           order.item.status = 'swapped';
           await order.item.save();
        }
      }
    } else if (orderStatus === 'cancelled' && order.paymentStatus === 'paid') {
      const buyer = await User.findById(order.buyer);
      if (buyer) {
        buyer.account_credits += order.itemPrice;
        await buyer.save();
        order.paymentStatus = 'refunded';

        if (order.item) {
           order.item.status = 'active';
           await order.item.save();
        }
      }
    }

    await order.save();

    res.status(200).json({ success: true, message: 'Order updated successfully', data: order });
  } catch (error) {
    console.error('Error in updateAdminOrderStatus:', error);
    res.status(500).json({ success: false, message: 'Server Error updating order' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    
    const totalItems = await Item.countDocuments();
    const activeItems = await Item.countDocuments({ status: 'active' });
    const pendingItems = await Item.countDocuments({ status: 'pending' });
    const swappedItems = await Item.countDocuments({ status: 'swapped' });

    const totalOrders = await Order.countDocuments();
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'delivered' });
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });

    const successfulTxns = await Transaction.find({ status: 'success' });
    const totalRevenue = successfulTxns.reduce((sum, txn) => sum + txn.amount, 0);

    const recentUsers = await User.find().select('full_name email profilePic created_at').sort({ created_at: -1 }).limit(5);

    // --- 1. DYNAMIC CATEGORY DATA ---
    const categoryDataRaw = await Item.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', value: { $sum: 1 } } },
      { $project: { name: '$_id', value: 1, _id: 0 } }
    ]);
    // Filter out empty names
    const categoryData = categoryDataRaw.filter(c => c.name);

    // --- 2. DYNAMIC PERFORMANCE DATA (Last 7 Days) ---
    const performanceData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - i);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);

      // Revenue for the day
      const dailyTxns = await Transaction.find({
        status: 'success',
        created_at: { $gte: startDate, $lte: endDate }
      });
      const dailyRevenue = dailyTxns.reduce((sum, txn) => sum + txn.amount, 0);

      // Swaps for the day
      const dailySwaps = await BarterRequest.countDocuments({
        status: 'ACCEPTED',
        updated_at: { $gte: startDate, $lte: endDate }
      });

      performanceData.push({
        name: days[startDate.getDay()],
        revenue: dailyRevenue,
        swaps: dailySwaps
      });
    }

    // --- 3. DYNAMIC RECENT ACTIVITY FEED ---
    let activities = [];

    // Swaps
    const recentSwaps = await BarterRequest.find({ status: 'ACCEPTED' }).sort({ updated_at: -1 }).limit(3).populate('item');
    recentSwaps.forEach(swap => activities.push({
      id: `swap-${swap._id}`,
      action: 'Swap Accepted',
      item: swap.item?.title || 'Item',
      time: swap.updated_at,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10 border-emerald-400/20'
    }));

    // New Items
    const recentItemsList = await Item.find().sort({ created_at: -1 }).limit(3);
    recentItemsList.forEach(item => activities.push({
      id: `item-${item._id}`,
      action: 'New Item Listed',
      item: item.title,
      time: item.created_at,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10 border-blue-400/20'
    }));

    // Transactions
    const recentTxnsList = await Transaction.find({ status: 'success' }).sort({ created_at: -1 }).limit(3);
    recentTxnsList.forEach(txn => activities.push({
      id: `txn-${txn._id}`,
      action: txn.transactionType === 'wallet_recharge' ? 'Credits Purchased' : 'Shipping Paid',
      item: `₹${txn.amount}`,
      time: txn.created_at,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10 border-yellow-400/20'
    }));

    // Orders
    const recentOrdersList = await Order.find({ orderStatus: 'delivered' }).sort({ updated_at: -1 }).limit(3).populate('item');
    recentOrdersList.forEach(order => activities.push({
      id: `order-${order._id}`,
      action: 'Order Delivered',
      item: order.item?.title || 'Item',
      time: order.updated_at,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10 border-purple-400/20'
    }));

    // Sort all activities by time (newest first) and keep top 6
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const recentActivity = activities.slice(0, 6);

    res.status(200).json({
      success: true,
      data: {
        users: { total: totalUsers, verified: verifiedUsers },
        items: { total: totalItems, active: activeItems, pending: pendingItems, swapped: swappedItems },
        orders: { total: totalOrders, delivered: deliveredOrders, pending: pendingOrders },
        revenue: totalRevenue,
        recentUsers,
        performanceData, 
        categoryData,    
        recentActivity   
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching dashboard stats' });
  }
};

module.exports = {
  getPendingItems,
  updateItemStatus,
  getAllItems, 
  getAllUsers, 
  updateUserRole, 
  deleteUser,
  getCreditSettings,     
  updateCreditSettings,
  getPublicCreditSettings,
  getAllTransactions,
  getAllOrders,             
  updateAdminOrderStatus    ,
  getDashboardStats
};
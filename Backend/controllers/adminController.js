const Item = require('../models/Item');
const User = require('../models/User'); 
const CreditSetting = require('../models/CreditSetting'); 
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const BarterRequest = require('../models/BarterRequest');
const Notification = require('../models/Notification');

const getPendingItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || '';

    let filter = { status: 'pending' };

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, 'i'); // 'i' makes it case-insensitive
      
      // Find matching users first
      const matchingUsers = await User.find({
        $or: [{ full_name: searchRegex }, { email: searchRegex }]
      }).select('_id');
      const userIds = matchingUsers.map(u => u._id);

      filter.$or = [
        { title: searchRegex },
        { category: searchRegex },
        { owner: { $in: userIds } }
      ];
    }

    const total = await Item.countDocuments(filter);
    const items = await Item.find(filter)
      .populate('owner', 'full_name email phone')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({ 
      success: true, 
      count: items.length, 
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: items 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || '';

    let filter = {};

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, 'i');
      
      const matchingUsers = await User.find({
        $or: [{ full_name: searchRegex }, { email: searchRegex }]
      }).select('_id');
      const userIds = matchingUsers.map(u => u._id);

      filter.$or = [
        { razorpay_order_id: searchRegex },
        { razorpay_payment_id: searchRegex },
        { user: { $in: userIds } }
      ];
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .populate('user', 'full_name email phone profilePic')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const incomeAgg = await Transaction.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalIncome = incomeAgg.length > 0 ? incomeAgg[0].total : 0;

    res.status(200).json({ 
      success: true, 
      totalIncome: totalIncome,
      count: transactions.length, 
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
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

    if ((status === 'active' && !wasAlreadyActive) || status === 'rejected') {
      const notifTitle = status === 'active' ? 'Item Approved! ✅' : 'Item Rejected ❌';
      const notifMessage = status === 'active' 
        ? `Aapka item "${item.title}" approve ho gaya hai aur ab live hai.` 
        : `Aapka item "${item.title}" reject kar diya gaya hai. Reason: ${item.rejection_reason}`;
      
      await Notification.create({
        user: item.owner,
        type: 'SYSTEM',
        title: notifTitle,
        message: notifMessage,
        metadata: { referenceId: item._id, newStatus: status }
      });
    }

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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || '';

    let filter = {};

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, 'i');
      
      const matchingUsers = await User.find({
        $or: [{ full_name: searchRegex }, { email: searchRegex }]
      }).select('_id');
      const userIds = matchingUsers.map(u => u._id);

      filter.$or = [
        { title: searchRegex },
        { category: searchRegex },
        { condition: searchRegex },
        { owner: { $in: userIds } }
      ];
    }

    const total = await Item.countDocuments(filter);
    const items = await Item.find(filter)
      .populate('owner', 'full_name email phone')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({ 
      success: true, 
      count: items.length, 
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: items 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || '';

    let filter = {};

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, 'i');
      filter.$or = [
        { full_name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { city: searchRegex }
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({ 
      success: true, 
      count: users.length, 
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: users 
    });
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
      milestoneReferralReward,
      autoCancelHours,
      auraReward,
      auraPenalty
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
    
    if (autoCancelHours !== undefined) setting.autoCancelHours = autoCancelHours;

    if (auraReward !== undefined) setting.auraReward = auraReward;
    if (auraPenalty !== undefined) setting.auraPenalty = auraPenalty;

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
      'isReferralSystemEnabled referralRewardCredits maxAllowedListings maxReferralLimit milestoneReferralReward isWelcomeBonusEnabled welcomeBonusAmount shippingMethod flatShippingCost autoCancelHours auraReward auraPenalty'
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
        flatShippingCost: 60,
        autoCancelHours: 24,
        auraReward: 50,
        auraPenalty: 50
      };
    }
    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || '';
    
    // -> MODIFICATION START
    const paymentStatusFilter = req.query.paymentStatus || '';
    let filter = {};

    if (paymentStatusFilter) {
      filter.paymentStatus = paymentStatusFilter;
    }
    // -> MODIFICATION END

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, 'i');
      
      const matchingUsers = await User.find({
        $or: [{ full_name: searchRegex }, { email: searchRegex }]
      }).select('_id');
      const userIds = matchingUsers.map(u => u._id);

      const matchingItems = await Item.find({ title: searchRegex }).select('_id');
      const itemIds = matchingItems.map(i => i._id);

      filter.$or = [
        { 'trackingDetails.awb_code': searchRegex },
        { orderStatus: searchRegex },
        { buyer: { $in: userIds } },
        { seller: { $in: userIds } },
        { item: { $in: itemIds } }
      ];
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('buyer', 'full_name email phone city pickupAddress')
      .populate('seller', 'full_name email phone city pickupAddress')
      .populate('item', 'title images estimated_value category condition')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({ 
      success: true, 
      count: orders.length, 
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: orders 
    });
  } catch (error) {
    console.error('Error fetching all orders for admin:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching orders' });
  }
};

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

    const [
      totalUsers,
      verifiedUsers, 
      totalItems,
      activeItems,
      pendingItems,
      swappedItems,
      totalOrders,
      deliveredOrders,
      pendingOrders,
      successfulTxns,
      recentUsers,
      categoryDataRaw, 
      recentSwaps,
      recentItemsList,
      recentTxnsList,
      recentOrdersList
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      Item.countDocuments(),
      Item.countDocuments({ status: 'active' }),
      Item.countDocuments({ status: 'pending' }),
      Item.countDocuments({ status: 'swapped' }),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'delivered' }),
      Order.countDocuments({ orderStatus: 'pending' }),
      Transaction.find({ status: 'success' }),
      User.find().select('full_name email profilePic created_at').sort({ created_at: -1 }).limit(5),
      Item.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$category', value: { $sum: 1 } } },
        { $project: { name: '$_id', value: 1, _id: 0 } }
      ]),
      BarterRequest.find({ status: 'ACCEPTED' }).sort({ updated_at: -1 }).limit(3).populate('item'),
      Item.find().sort({ created_at: -1 }).limit(3),
      Transaction.find({ status: 'success' }).sort({ created_at: -1 }).limit(3),
      Order.find({ orderStatus: 'delivered' }).sort({ updated_at: -1 }).limit(3).populate('item')
    ]);

    // Current Month Orders
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const currentMonthOrders = await Order.countDocuments({
      created_at: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalRevenue = successfulTxns.reduce((sum, txn) => sum + txn.amount, 0);
    const categoryData = categoryDataRaw.filter(c => c.name);

    // -> MODIFICATION START
    // 2. Loop for 7 days (Run in parallel instead of sequence)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [txnsAgg, swapsAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { status: 'success', created_at: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }, revenue: { $sum: "$amount" } } }
      ]),
      BarterRequest.aggregate([
        { $match: { status: 'ACCEPTED', updated_at: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$updated_at" } }, swaps: { $sum: 1 } } }
      ])
    ]);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const performanceData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];

      const txnData = txnsAgg.find(t => t._id === dateString);
      const swapData = swapsAgg.find(s => s._id === dateString);

      performanceData.push({
        name: days[d.getDay()],
        revenue: txnData ? txnData.revenue : 0,
        swaps: swapData ? swapData.swaps : 0
      });
    }
    // -> MODIFICATION END

    // 3. Map Activities
    let activities = [];

    recentSwaps.forEach(swap => activities.push({
      id: `swap-${swap._id}`,
      action: 'Swap Accepted',
      item: swap.item?.title || 'Item',
      time: swap.updated_at,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10 border-emerald-400/20'
    }));

    recentItemsList.forEach(item => activities.push({
      id: `item-${item._id}`,
      action: 'New Item Listed',
      item: item.title,
      time: item.created_at,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10 border-blue-400/20'
    }));

    recentTxnsList.forEach(txn => activities.push({
      id: `txn-${txn._id}`,
      action: txn.transactionType === 'wallet_recharge' ? 'Credits Purchased' : 'Shipping Paid',
      item: `₹${txn.amount}`,
      time: txn.created_at,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10 border-yellow-400/20'
    }));

    recentOrdersList.forEach(order => activities.push({
      id: `order-${order._id}`,
      action: 'Order Delivered',
      item: order.item?.title || 'Item',
      time: order.updated_at,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10 border-purple-400/20'
    }));

    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const recentActivity = activities.slice(0, 6);

    res.status(200).json({
      success: true,
      data: {
        users: { total: totalUsers, verified: verifiedUsers },
        items: { total: totalItems, active: activeItems, pending: pendingItems, swapped: swappedItems },
        orders: { total: totalOrders, delivered: deliveredOrders, pending: pendingOrders, currentMonth: currentMonthOrders },
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

// -> MODIFICATION START
const resolveFailedRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { adminNote, transactionId } = req.body; 

    const order = await Order.findById(orderId).populate('buyer');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus !== 'refund_failed') {
      return res.status(400).json({ success: false, message: 'Order payment status is not refund_failed' });
    }

    order.paymentStatus = 'refunded'; 
    await order.save();

    await Transaction.create({
      user: order.buyer._id,
      amount: order.shippingCost,
      razorpay_payment_id: transactionId || 'manual_upi_transfer',
      status: 'success',
      transactionType: 'shipping_refund'
    });

    await Notification.create({
      user: order.buyer._id,
      type: 'CREDIT_ADDED',
      title: 'Refund Resolved Manually ✅',
      message: `Your shipping refund of ₹${order.shippingCost} has been processed manually by our support team. Note: ${adminNote || 'Processed via UPI/Bank transfer'}`,
      metadata: { amount: order.shippingCost, reason: 'manual_refund_resolved', referenceId: order._id }
    });

    res.status(200).json({ 
      success: true, 
      message: 'Failed refund marked as resolved manually', 
      data: order 
    });
  } catch (error) {
    console.error('Error resolving failed refund:', error);
    res.status(500).json({ success: false, message: 'Server Error resolving refund' });
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
  updateAdminOrderStatus,
  getDashboardStats,
  resolveFailedRefund 
};
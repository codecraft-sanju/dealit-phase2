// adminController.js
const Item = require('../models/Item');
const User = require('../models/User'); 
const CreditSetting = require('../models/CreditSetting'); 
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const BarterRequest = require('../models/BarterRequest');
const Notification = require('../models/Notification');

// IMPORT PAYMENT CONTROLLER FOR RAZORPAY RETRY
const { refundRazorpayPayment } = require('./paymentController');

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

    // STRICT FILTER: Only Real Money (Rupees) transactions are allowed
    let filter = {
      transactionType: { $in: ['wallet_recharge', 'shipping_fee', 'shipping_refund'] }
    };

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, 'i');
      
      const matchingUsers = await User.find({
        $or: [{ full_name: searchRegex }, { email: searchRegex }]
      }).select('_id');
      const userIds = matchingUsers.map(u => u._id);

      // Combined the search query with the Real Money filter
      filter = {
        $and: [
          { transactionType: { $in: ['wallet_recharge', 'shipping_fee', 'shipping_refund'] } },
          {
            $or: [
              { razorpay_order_id: searchRegex },
              { razorpay_payment_id: searchRegex },
              { user: { $in: userIds } }
            ]
          }
        ]
      };
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .populate('user', 'full_name email phone profilePic')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    // In aggregate also, only calculate total for successful Real Money transactions
    const incomeAgg = await Transaction.aggregate([
      { 
        $match: { 
          status: 'success', 
          transactionType: { $in: ['wallet_recharge', 'shipping_fee', 'shipping_refund'] } 
        } 
      },
      { 
        $group: { 
          _id: '$transactionType', 
          total: { $sum: '$amount' } 
        } 
      }
    ]);

    let walletIncome = 0;
    let shippingIncome = 0;
    let totalRefunds = 0;

    incomeAgg.forEach(item => {
      if (item._id === 'wallet_recharge') {
        walletIncome += item.total;
      } else if (item._id === 'shipping_fee') {
        shippingIncome += item.total;
      } else if (item._id === 'shipping_refund') {
        totalRefunds += item.total;
      }
    });

    const totalRevenue = walletIncome + shippingIncome;
    const netIncome = totalRevenue - totalRefunds;

    res.status(200).json({ 
      success: true, 
      financials: {
        walletIncome: walletIncome,
        shippingIncome: shippingIncome,
        totalRevenue: totalRevenue,
        totalRefunds: totalRefunds,
        netIncome: netIncome
      },
      totalIncome: netIncome, 
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
    const { status, rejection_reason, awarded_credits } = req.body; 
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

    // BASIC STATUS NOTIFICATION
    if ((status === 'active' && !wasAlreadyActive) || status === 'rejected') {
      const notifTitle = status === 'active' ? 'Item Approved! ✅' : 'Item Rejected ❌';
      const notifMessage = status === 'active' 
        ? `Your item "${item.title}" has been approved and is now live.` 
        : `Your item "${item.title}" has been rejected. Reason: ${item.rejection_reason}`;
      
      await Notification.create({
        user: item.owner,
        type: 'SYSTEM',
        title: notifTitle,
        message: notifMessage,
        metadata: { referenceId: item._id, newStatus: status }
      });
    }

    // SMART CREDIT ASSIGNMENT AND DETAILED NOTIFICATIONS
    if (status === 'active' && !wasAlreadyActive) {
      let setting = await CreditSetting.findOne();
      if (!setting) {
        setting = { isCreditSystemEnabled: true, creditsPerListing: 50, maxListingsRewarded: 3 };
      }

      if (setting.isCreditSystemEnabled) {
        const user = await User.findById(item.owner);
        if (user) {
          let creditsToGive = 0;
          let detailedMessage = '';

          // 1. Admin provided a manual credit amount
          if (awarded_credits !== undefined && awarded_credits !== null && awarded_credits !== '') {
            creditsToGive = Number(awarded_credits);
            detailedMessage = `Admin has manually awarded you ${creditsToGive} credits for your approved item "${item.title}".`;
          } else {
            // 2. Automated System Logic
            const activeItemsCount = await Item.countDocuments({ owner: item.owner, status: 'active' });

            if (activeItemsCount <= setting.maxListingsRewarded) {
              creditsToGive = setting.creditsPerListing;
              detailedMessage = `You received the standard reward of ${creditsToGive} credits for successfully listing your item "${item.title}".`;
            } else {
              creditsToGive = 0;
              detailedMessage = `Your item "${item.title}" was approved, but you did not receive credits because you have already reached the maximum reward limit of ${setting.maxListingsRewarded} rewarded listings.`;
            }
          }

          // Apply credits if > 0 and send the specific notification
          if (creditsToGive > 0) {
            user.account_credits = (user.account_credits || 0) + creditsToGive;
            await user.save();

            await Notification.create({
              user: item.owner,
              type: 'CREDIT_ADDED',
              title: 'Credits Received! 💰',
              message: detailedMessage,
              metadata: { referenceId: item._id, amount: creditsToGive }
            });
          } else {
             // Notify user why they got 0 credits
             await Notification.create({
              user: item.owner,
              type: 'SYSTEM_ALERT',
              title: 'Credit Limit Reached ℹ️',
              message: detailedMessage,
              metadata: { referenceId: item._id, amount: 0 }
            });
          }
        }
      } else {
         // Credit system is paused globally
         await Notification.create({
            user: item.owner,
            type: 'SYSTEM_ALERT',
            title: 'Credit System Paused ⏸️',
            message: `Your item "${item.title}" was approved, but the credit reward system is currently paused by the administration.`,
            metadata: { referenceId: item._id, amount: 0 }
          });
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
      auraPenalty,
      minImagesRequired
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
    
    if (minImagesRequired !== undefined) setting.minImagesRequired = minImagesRequired;

    setting.updated_at = Date.now();

    await setting.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Credit settings updated successfully', 
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
      'isReferralSystemEnabled referralRewardCredits maxAllowedListings maxReferralLimit milestoneReferralReward isWelcomeBonusEnabled welcomeBonusAmount shippingMethod flatShippingCost autoCancelHours auraReward auraPenalty minImagesRequired'
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
        auraPenalty: 50,
        minImagesRequired: 3
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
    
    const paymentStatusFilter = req.query.paymentStatus || '';
    let filter = {};

    if (paymentStatusFilter) {
      filter.paymentStatus = paymentStatusFilter;
    }

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
      successfulTxns, // Real money only
      recentUsers,
      categoryDataRaw, 
      recentSwaps,
      recentItemsList,
      recentTxnsList, // Real money only
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
      Transaction.find({ status: 'success', transactionType: { $in: ['wallet_recharge', 'shipping_fee', 'shipping_refund'] } }),
      User.find().select('full_name email profilePic created_at').sort({ created_at: -1 }).limit(5),
      Item.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$category', value: { $sum: 1 } } },
        { $project: { name: '$_id', value: 1, _id: 0 } }
      ]),
      BarterRequest.find({ status: 'ACCEPTED' }).sort({ updated_at: -1 }).limit(3).populate('item'),
      Item.find().sort({ created_at: -1 }).limit(3),
      Transaction.find({ status: 'success', transactionType: { $in: ['wallet_recharge', 'shipping_fee', 'shipping_refund'] } }).sort({ created_at: -1 }).limit(3),
      Order.find({ orderStatus: 'delivered' }).sort({ updated_at: -1 }).limit(3).populate('item')
    ]);

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

    let walletIncome = 0;
    let shippingIncome = 0;
    let totalRefunds = 0;

    successfulTxns.forEach(txn => {
      if (txn.transactionType === 'wallet_recharge') {
        walletIncome += txn.amount;
      } else if (txn.transactionType === 'shipping_fee') {
        shippingIncome += txn.amount;
      } else if (txn.transactionType === 'shipping_refund') {
        totalRefunds += txn.amount;
      }
    });

    const totalRevenue = walletIncome + shippingIncome;
    const netIncome = totalRevenue - totalRefunds;
    
    const filteredCategories = categoryDataRaw.filter(c => c.name);
    const sortedCategories = filteredCategories.sort((a, b) => b.value - a.value);
    let categoryData = sortedCategories;

    if (sortedCategories.length > 5) {
      const top4 = sortedCategories.slice(0, 4);
      const othersValue = sortedCategories.slice(4).reduce((sum, cat) => sum + cat.value, 0);
      categoryData = [...top4, { name: 'Others', value: othersValue }];
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [txnsAgg, swapsAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { 
            status: 'success', 
            created_at: { $gte: sevenDaysAgo },
            transactionType: { $in: ['wallet_recharge', 'shipping_fee'] } // Graph for positive revenue only
        } },
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
      action: txn.transactionType === 'shipping_refund' ? 'Bank Refund Processed' : (txn.transactionType === 'wallet_recharge' ? 'Credits Purchased' : 'Shipping Paid'),
      item: `₹${txn.amount}`,
      time: txn.created_at,
      color: txn.transactionType === 'shipping_refund' ? 'text-red-400' : 'text-yellow-400',
      bg: txn.transactionType === 'shipping_refund' ? 'bg-red-400/10 border-red-400/20' : 'bg-yellow-400/10 border-yellow-400/20'
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
        financials: {
          walletIncome,
          shippingIncome,
          totalRevenue,
          totalRefunds,
          netIncome
        },
        revenue: netIncome, 
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
      title: 'Refund Resolved Manually',
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

// NEW FUNCTION: Auto Retry Refund using Razorpay
const retryFailedRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('buyer');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus !== 'refund_failed') {
      return res.status(400).json({ success: false, message: 'Only failed refunds can be retried' });
    }

    if (order.shippingCost <= 0 || !order.razorpay_payment_id) {
        return res.status(400).json({ success: false, message: 'No valid Razorpay payment found to refund' });
    }

    // Call Razorpay API again
    const refundRes = await refundRazorpayPayment(order.razorpay_payment_id, order.shippingCost);
    
    if (!refundRes.success) {
        return res.status(500).json({ 
          success: false, 
          message: 'Razorpay refund failed again. Check Razorpay dashboard.', 
          error: refundRes.error 
        });
    }

    // Since bank takes time, move to refund_processing
    order.paymentStatus = 'refund_processing';
    await order.save();

    // Log the transaction
    await Transaction.create({
      user: order.buyer._id,
      amount: order.shippingCost,
      razorpay_order_id: order.razorpay_order_id,
      razorpay_payment_id: order.razorpay_payment_id,
      status: 'success',
      transactionType: 'shipping_refund' 
    });

    await Notification.create({
      user: order.buyer._id,
      type: 'SYSTEM_ALERT',
      title: 'Refund Retried Successfully 🔄',
      message: `Your shipping refund of ₹${order.shippingCost} has been re-initiated and is processing.`,
      metadata: { amount: order.shippingCost, reason: 'retry_refund_success', referenceId: order._id }
    });

    res.status(200).json({ 
      success: true, 
      message: 'Refund re-initiated successfully via Razorpay', 
      data: order 
    });

  } catch (error) {
    console.error('Error retrying refund:', error);
    res.status(500).json({ success: false, message: 'Server Error retrying refund' });
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
  resolveFailedRefund,
  retryFailedRefund 
};
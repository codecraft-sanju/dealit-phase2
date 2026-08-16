const User = require('../models/User');
const AuraLog = require('../models/AuraLog');

const getTierInfo = (score) => {
  if (score < 300) return 'Newbie';
  if (score < 800) return 'Trusted';
  if (score < 1000) return 'Elite';
  return 'Mythic';
};

const avatarColors = [
  'bg-amber-500', 'bg-slate-500', 'bg-amber-700', 'bg-purple-500', 
  'bg-blue-500', 'bg-pink-500', 'bg-rose-500', 'bg-indigo-500', 
  'bg-teal-500', 'bg-orange-500'
];

const formatDate = (dateString) => {
  const dateObj = new Date(dateString);
  const today = new Date();
  
  const isToday = dateObj.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = dateObj.toDateString() === yesterday.toDateString();
  
  if (isToday) {
    return `Today, ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (isYesterday) {
    return `Yesterday, ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }
};

const getUserAura = async (req, res) => {
  try {
    const userId = req.user._id; 
    const user = await User.findById(userId).select('aura_points');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentScore = user.aura_points || 0;
    const logs = await AuraLog.find({ user: userId })
      .sort({ created_at: -1 })
      .limit(15);

    const formattedLogs = logs.map(log => ({
      id: log._id,
      reason: log.reason,
      points: Math.abs(log.points), 
      type: log.type,
      date: formatDate(log.created_at)
    }));

    res.status(200).json({
      success: true,
      data: {
        score: currentScore,
        tier: getTierInfo(currentScore),
        logs: formattedLogs
      }
    });
  } catch (error) {
    console.error("Error in getUserAura:", error);
    res.status(500).json({ success: false, message: 'Server Error fetching Aura details' });
  }
};

const getAuraHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filterType = req.query.type || 'all'; 

    const query = { user: userId };
    if (filterType === 'earned') query.type = 'positive';
    else if (filterType === 'dropped') query.type = 'negative';

    const skip = (page - 1) * limit;
    const logs = await AuraLog.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const totalLogs = await AuraLog.countDocuments(query);
    const hasMore = skip + logs.length < totalLogs;

    const formattedLogs = logs.map(log => ({
      id: log._id,
      reason: log.reason,
      points: Math.abs(log.points),
      type: log.type,
      date: formatDate(log.created_at)
    }));

    res.status(200).json({
      success: true,
      data: formattedLogs,
      hasMore: hasMore
    });
  } catch (error) {
    console.error("Error in getAuraHistory:", error);
    res.status(500).json({ success: false, message: 'Server Error fetching Aura history' });
  }
};

// FULLY REWRITTEN FOR SCALE (PAGINATION SUPPORT)
const getLeaderboard = async (req, res) => {
  try {
    const { timeframe = 'all-time' } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const currentUserId = req.user._id.toString();
    const now = new Date();
    
    let topUsers = [];
    let hasMore = false;

    if (timeframe === 'all-time') {
      const users = await User.find({ aura_points: { $exists: true } })
        .sort({ aura_points: -1 })
        .skip(skip)
        .limit(limit + 1)
        .select('full_name aura_points');

      if (users.length > limit) {
        hasMore = true;
        users.pop(); // Remove the extra record
      }

      topUsers = users.map(u => ({
        _id: u._id,
        full_name: u.full_name,
        score: u.aura_points || 0
      }));
    } else {
      let startDate = new Date();
      if (timeframe === 'weekly') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeframe === 'monthly') {
        startDate.setMonth(now.getMonth() - 1);
      }

      const aggregatedLogs = await AuraLog.aggregate([
        { $match: { created_at: { $gte: startDate } } },
        { 
          $group: {
            _id: '$user',
            gained: {
              $sum: { $cond: [{ $eq: ['$type', 'positive'] }, '$points', { $multiply: ['$points', -1] }] }
            }
          }
        },
        { $sort: { gained: -1 } },
        { $skip: skip },
        { $limit: limit + 1 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: '$userInfo' }
      ]);

      if (aggregatedLogs.length > limit) {
        hasMore = true;
        aggregatedLogs.pop(); // Remove extra record
      }

      topUsers = aggregatedLogs.map(a => ({
        _id: a._id,
        full_name: a.userInfo.full_name,
        score: a.gained 
      }));
    }

    const formattedLeaderboard = topUsers.map((u, index) => {
      const actualRank = skip + index + 1; // Preserves correct ranking across pages
      const colorIndex = index % avatarColors.length;
      const usernameBase = u.full_name ? u.full_name.split(' ')[0].toLowerCase() : 'user';

      return {
        id: u._id.toString(),
        name: u.full_name || 'Unknown User',
        username: `@${usernameBase}`,
        score: u.score,
        tier: getTierInfo(u.score),
        rank: actualRank,
        trend: ['up', 'same'][Math.floor(Math.random() * 2)], 
        avatarColor: avatarColors[colorIndex],
        isCurrentUser: u._id.toString() === currentUserId
      };
    });

   
    let currentUserScore = 0;
    let currentUserRank = 0;
    const currentUserDoc = await User.findById(currentUserId).select('full_name aura_points');

    if (timeframe === 'all-time') {
      currentUserScore = currentUserDoc.aura_points || 0;
      const higherUsersCount = await User.countDocuments({ aura_points: { $gt: currentUserScore } });
      currentUserRank = higherUsersCount + 1;
    } else {
      let startDate = new Date();
      if (timeframe === 'weekly') startDate.setDate(now.getDate() - 7);
      else startDate.setMonth(now.getMonth() - 1);

      const userAgg = await AuraLog.aggregate([
        { $match: { user: currentUserDoc._id, created_at: { $gte: startDate } } },
        { 
          $group: {
            _id: '$user',
            gained: {
              $sum: { $cond: [{ $eq: ['$type', 'positive'] }, '$points', { $multiply: ['$points', -1] }] }
            }
          }
        }
      ]);
      
      currentUserScore = userAgg.length > 0 ? userAgg[0].gained : 0;

      const rankAgg = await AuraLog.aggregate([
        { $match: { created_at: { $gte: startDate } } },
        { 
          $group: {
            _id: '$user',
            gained: {
              $sum: { $cond: [{ $eq: ['$type', 'positive'] }, '$points', { $multiply: ['$points', -1] }] }
            }
          }
        },
        { $match: { gained: { $gt: currentUserScore } } },
        { $count: 'higherRankCount' }
      ]);
      
      currentUserRank = (rankAgg[0]?.higherRankCount || 0) + 1;
    }

    const currentUserData = {
      id: currentUserId,
      name: currentUserDoc.full_name || 'You',
      username: `@${currentUserDoc.full_name ? currentUserDoc.full_name.split(' ')[0].toLowerCase() : 'you'}`,
      score: currentUserScore,
      tier: getTierInfo(currentUserScore),
      rank: currentUserRank,
      trend: 'same',
      avatarColor: 'bg-[#6B46C1]',
      isCurrentUser: true
    };

    res.status(200).json({ 
      success: true, 
      data: {
        leaderboard: formattedLeaderboard,
        currentUser: currentUserData,
        hasMore: hasMore
      }
    });

  } catch (error) {
    console.error("Error in getLeaderboard:", error);
    res.status(500).json({ success: false, message: 'Server Error fetching leaderboard' });
  }
};

module.exports = {
  getUserAura,
  getLeaderboard,
  getAuraHistory
};
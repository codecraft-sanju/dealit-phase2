const User = require('../models/User');
const AuraLog = require('../models/AuraLog');


const getTierInfo = (score) => {
  if (score < 300) return 'Newbie';
  if (score < 800) return 'Trusted';
  if (score < 1000) return 'Elite';
  return 'Mythic';
};

// Main function to fetch User's Aura Data
const getUserAura = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming auth middleware sets req.user._id

    // Fetch user score
    const user = await User.findById(userId).select('aura_points');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentScore = user.aura_points || 0;

    // Fetch latest 15 logs
    const logs = await AuraLog.find({ user: userId })
      .sort({ created_at: -1 })
      .limit(15);

    // Date formatter specific for Activity UI
    const formattedLogs = logs.map(log => {
      const dateObj = new Date(log.created_at);
      const today = new Date();
      
      const isToday = dateObj.toDateString() === today.toDateString();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = dateObj.toDateString() === yesterday.toDateString();
      
      let dateString = '';
      if (isToday) {
        dateString = `Today, ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (isYesterday) {
        dateString = `Yesterday, ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        // Ex: "15 Apr 2026"
        dateString = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      }

      return {
        id: log._id,
        reason: log.reason,
        points: Math.abs(log.points), // Always positive, UI decides color based on type
        type: log.type,
        date: dateString
      };
    });

    // Send exactly what frontend needs
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

module.exports = {
  getUserAura
};
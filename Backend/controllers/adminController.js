const Item = require('../models/Item');
const User = require('../models/User'); 
const CreditSetting = require('../models/CreditSetting'); 

const getPendingItems = async (req, res) => {
  try {
    const items = await Item.find({ status: 'pending' }).populate('owner', 'full_name email phone').sort({ created_at: -1 });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
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
      isWelcomeBonusEnabled, // ADDED
      welcomeBonusAmount,    // ADDED
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
    
    // ADDED LOGIC FOR WELCOME BONUS
    if (isWelcomeBonusEnabled !== undefined) setting.isWelcomeBonusEnabled = isWelcomeBonusEnabled;
    if (welcomeBonusAmount !== undefined) setting.welcomeBonusAmount = welcomeBonusAmount;
  
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
      // ADDED isWelcomeBonusEnabled and welcomeBonusAmount here
      'isReferralSystemEnabled referralRewardCredits maxAllowedListings maxReferralLimit milestoneReferralReward isWelcomeBonusEnabled welcomeBonusAmount'
    );
    
    if (!setting) {
      setting = { 
        isReferralSystemEnabled: true, 
        referralRewardCredits: 40, 
        maxAllowedListings: 5,
        maxReferralLimit: 5,
        milestoneReferralReward: 100,
        isWelcomeBonusEnabled: true, 
        welcomeBonusAmount: 50       
      };
    }
    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
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
  getPublicCreditSettings 
};
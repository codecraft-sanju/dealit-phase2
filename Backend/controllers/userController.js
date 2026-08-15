const User = require('../models/User');
const CreditSetting = require('../models/CreditSetting'); 
const { queueNotification } = require('../services/queue');
const AuraLog = require('../models/AuraLog'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const Item = require('../models/Item');
const Order = require('../models/Order');
const BarterRequest = require('../models/BarterRequest');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const client = new OAuth2Client(); 

const sendTokenResponse = (user, statusCode, res, message) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '36500d' 
  });

  const isProduction = process.env.NODE_ENV === 'production';

  const options = {
    expires: new Date(Date.now() + 36500 * 24 * 60 * 60 * 1000),
    httpOnly: true, 
    secure: isProduction, 
    sameSite: isProduction ? 'none' : 'lax' 
  };
  
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    message,
    token: token, 
    user: { 
      id: user._id, 
      full_name: user.full_name, 
      email: user.email, 
      phone: user.phone,             // Added phone
      city: user.city,               // Added city
      profilePic: user.profilePic,   // Added profilePic
      role: user.role,
      account_credits: user.account_credits,
      aura_points: user.aura_points, 
      hasClaimedWelcomeBonus: user.hasClaimedWelcomeBonus, 
      referralCode: user.referralCode,
      totalReferrals: user.totalReferrals,
      listedProductsCount: user.listedProductsCount || 0,
      rewardedListingsCount: user.rewardedListingsCount || 0, 
      savedAddresses: user.savedAddresses || [] 
    }
  });
};

const generateUniqueReferralCode = async (name) => {
  let isUnique = false;
  let code = '';

  const prefix = name.substring(0, 3).toUpperCase().padEnd(3, 'X'); 

  while (!isUnique) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    code = `${prefix}${randomNum}`;

    const existingCode = await User.findOne({ referralCode: code });
    if (!existingCode) {
      isUnique = true; 
    }
  }
  return code;
};


const registerUser = async (req, res) => {
  try {
    let { email, referralCodeInput } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    email = email.toLowerCase().trim();
    
    let user = await User.findOne({ email });
    
    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ success: false, message: 'User already exists with this email. Please login.' });
      }
    } else {
      
      const defaultName = email.split('@')[0];
      const newReferralCode = await generateUniqueReferralCode(defaultName);

      let referrerUserId = null;
      if (referralCodeInput) {
        const referrerUser = await User.findOne({ referralCode: referralCodeInput });
        if (referrerUser && !referrerUser.isDeleted) {
           referrerUserId = referrerUser._id;
        }
      }

      user = new User({
        full_name: defaultName,
        email,
        isVerified: false,
        referralCode: newReferralCode,
        referredBy: referrerUserId
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; 
    await user.save();

    const message = `Hi ${user.full_name},\n\nYour OTP for Dealit registration is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nRegards,\nTeam Dealit`;
    
    await sendEmail({
      email: user.email,
      subject: 'Verify your Dealit Account',
      message
    });

    return res.status(200).json({ 
      success: true, 
      requiresOtp: true, 
      message: 'OTP sent to your email. Please verify to complete registration.',
      email: user.email
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error during registration' });
  }
};


const verifyOtp = async (req, res) => {
  try {
    let { email, otp } = req.body;
    if (email) email = email.toLowerCase().trim();

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Check if this is their first time verifying (Registration)
    const isFirstTimeVerification = !user.isVerified;

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    // Apply Referral Reward ONLY on first-time verification
    if (isFirstTimeVerification && user.referredBy) {
      const creditSettings = await CreditSetting.findOne();
      const isEnabled = creditSettings ? creditSettings.isReferralSystemEnabled : true;
      const referralReward = creditSettings ? creditSettings.referralRewardCredits : 40;
      
      if (isEnabled) {
          const referrerUser = await User.findById(user.referredBy);
          
          if (referrerUser && !referrerUser.isDeleted) {
              referrerUser.totalReferrals += 1;
              referrerUser.account_credits += referralReward;
              await referrerUser.save();

              user.account_credits += referralReward; // Reward the new user too
              
              queueNotification({
                user: referrerUser._id,
                type: 'CREDIT_ADDED',
                title: 'Referral Bonus! 🎁',
                message: `Your friend joined Dealit! You earned ${referralReward} credits.`,
                metadata: { amount: referralReward, reason: 'referral' }
              });
          }
      }
    }

    await user.save();

    sendTokenResponse(user, 200, res, 'Account verified and logged in successfully!');

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error during OTP verification' });
  }
};


const loginUser = async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });
    
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: 'Account not found. Please sign up first.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    const message = `Hi ${user.full_name},\n\nYour login OTP for Dealit is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nRegards,\nTeam Dealit`;
    
    await sendEmail({
      email: user.email,
      subject: 'Your Dealit Login OTP',
      message
    });

    return res.status(200).json({ 
      success: true, 
      requiresOtp: true, 
      message: 'OTP sent to your email.' 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error during login' });
  }
};


const googleLogin = async (req, res) => {
  try {
    const { token, referralCodeInput } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Google token is required' });
    }

    let email, name, picture;

    if (token.split('.').length === 3) {
      const audienceList = [
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_ANDROID_CLIENT_ID
      ].filter(Boolean);

      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: audienceList,
      });

      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } else {
      const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      email = googleRes.data.email;
      name = googleRes.data.name;
      picture = googleRes.data.picture;
    }

    const cleanEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      if (user.isDeleted) {
        return res.status(401).json({ success: false, message: 'Account has been deleted.' });
      }
      
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }

      if (!user.profilePic && picture) {
        user.profilePic = picture;
        await user.save();
      }
    } else {
      const newReferralCode = await generateUniqueReferralCode(name);
      
      let referrerUserId = null;
      if (referralCodeInput) {
        const referrerUser = await User.findOne({ referralCode: referralCodeInput });
        if (referrerUser && !referrerUser.isDeleted) {
           referrerUserId = referrerUser._id;
        }
      }

      user = new User({
        full_name: name,
        email: cleanEmail,
        profilePic: picture || '',
        isVerified: true,
        referralCode: newReferralCode,
        aura_points: 100,
        referredBy: referrerUserId
      });

      if (referrerUserId) {
        const creditSettings = await CreditSetting.findOne();
        const isEnabled = creditSettings ? creditSettings.isReferralSystemEnabled : true;
        const referralReward = creditSettings ? creditSettings.referralRewardCredits : 40;
        
        if (isEnabled) {
            const referrerUser = await User.findById(referrerUserId);
            
            if (referrerUser && !referrerUser.isDeleted) {
                referrerUser.totalReferrals += 1;
                referrerUser.account_credits += referralReward;
                await referrerUser.save();

                user.account_credits += referralReward;
                
                queueNotification({
                  user: referrerUser._id,
                  type: 'CREDIT_ADDED',
                  title: 'Referral Bonus! 🎁',
                  message: `Your friend joined Dealit via Google! You earned ${referralReward} credits.`,
                  metadata: { amount: referralReward, reason: 'referral' }
                });
            }
        }
      }

      await user.save();
    }

    sendTokenResponse(user, 200, res, 'Google login successful!');
  } catch (error) {
    console.error('Google token verification failed:', error);
    res.status(500).json({ success: false, message: 'Authentication failed with Google' });
  }
};

const logoutUser = (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
  
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

const forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;
    if (email) email = email.toLowerCase().trim();
    
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'There is no user with that email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = Date.now() + 10 * 60 * 1000; 

    await user.save({ validateBeforeSave: false });

    const message = `Your password reset OTP is: ${otp}\nThis OTP is valid for 10 minutes.\nIf you did not request this, please ignore this email.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset OTP',
        message
      });

      res.status(200).json({ success: true, message: 'OTP sent to email' });
    } catch (error) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpiry = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    let { email, otp, newPassword } = req.body;
    if (email) email = email.toLowerCase().trim();

    const user = await User.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordOtpExpiry: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password reset successful. You are now logged in.');
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getUserProfile = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
       return res.status(401).json({ success: false, message: 'Not authorized, no user data found in request' });
    }

    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.referralCode) {
      const newCode = await generateUniqueReferralCode(user.full_name);
      user.referralCode = newCode;
      await user.save();
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error fetching profile' });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { full_name, phone, city, pickupAddress } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    let user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (full_name) user.full_name = full_name;
    if (phone) user.phone = phone;
    if (city) user.city = city;
    
  
    if (pickupAddress) {
      user.pickupAddress = {
        houseNo: pickupAddress.houseNo || user.pickupAddress?.houseNo,
        areaStreet: pickupAddress.areaStreet || user.pickupAddress?.areaStreet,
        landmark: pickupAddress.landmark || user.pickupAddress?.landmark,
        city: pickupAddress.city || user.pickupAddress?.city,
        state: pickupAddress.state || user.pickupAddress?.state,
        pincode: pickupAddress.pincode || user.pickupAddress?.pincode,
      };
    }

    user.updated_at = Date.now();
    await user.save();

    res.status(200).json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error updating profile' });
  }
};

const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    
    const [receivedSwaps, sentSwaps, activeOrders] = await Promise.all([
      
      BarterRequest.countDocuments({ 
        owner: userId, 
        status: { $in: ['PENDING', 'AWAITING_PAYMENT'] } 
      }),
      
      BarterRequest.countDocuments({ 
        requester: userId, 
        status: { $in: ['PENDING', 'AWAITING_PAYMENT'] } 
      }),
      
      Order.countDocuments({
        $or: [{ buyer: userId }, { seller: userId }],
        orderStatus: { $in: ['pending', 'processing', 'shipped', 'in_transit'] }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        swapsActive: receivedSwaps + sentSwaps,
        receivedSwaps,
        sentSwaps,
        activeOrders
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching stats' });
  }
};

const updateProfilePic = async (req, res) => {
  try {
    const { profilePic } = req.body;
    
    if (!profilePic) {
      return res.status(400).json({ success: false, message: 'Please provide an image URL' });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: profilePic, updated_at: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'Profile picture updated', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error updating profile pic' });
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const index = user.wishlist.indexOf(itemId);

    if (index === -1) {
      user.wishlist.push(itemId);
      await user.save();
      return res.status(200).json({ success: true, message: 'Added to wishlist', isWishlisted: true });
    } else {
      user.wishlist.splice(index, 1);
      await user.save();
      return res.status(200).json({ success: true, message: 'Removed from wishlist', isWishlisted: false });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error toggling wishlist' });
  }
};

const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      match: { status: 'active' }, 
      populate: { path: 'owner', select: 'full_name city profilePic' } 
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const activeWishlist = user.wishlist.filter(item => item !== null);

    res.status(200).json({ success: true, count: activeWishlist.length, data: activeWishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error fetching wishlist' });
  }
};

const claimWelcomeBonus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.hasClaimedWelcomeBonus) {
      return res.status(400).json({ success: false, message: 'Welcome bonus already claimed' });
    }

    const setting = await CreditSetting.findOne();
    const isEnabled = setting ? setting.isWelcomeBonusEnabled : true;
    const amount = setting ? setting.welcomeBonusAmount : 50;

    if (!isEnabled) {
      return res.status(400).json({ success: false, message: 'Welcome bonus is currently disabled by Admin' });
    }

  
    user.account_credits += amount;
    user.aura_points = (user.aura_points || 0) + 50; 
    user.hasClaimedWelcomeBonus = true;
    await user.save();

    
    queueNotification({
      user: user._id,
      type: 'CREDIT_ADDED',
      title: 'Welcome Bonus! ',
      message: `You have received ${amount} credits and 50 Aura points for joining Dealit. Start exploring!`,
      metadata: { amount: amount, reason: 'signup_bonus' }
    });

    
    await AuraLog.create({
      user: user._id,
      reason: "Welcome Bonus Claimed",
      points: 50,
      type: "positive"
    });

    res.status(200).json({
      success: true,
      message: `Successfully claimed ${amount} credits!`,
      data: {
        account_credits: user.account_credits,
        aura_points: user.aura_points,
        hasClaimedWelcomeBonus: user.hasClaimedWelcomeBonus
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error while claiming bonus' });
  }
};

const deleteUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isDeleted) {
      return res.status(400).json({ success: false, message: 'Account is already deleted' });
    }

    const activeOrders = await Order.findOne({ 
      $or: [{ buyer: userId }, { seller: userId }], 
      orderStatus: { $nin: ['delivered', 'cancelled'] } 
    });

    if (activeOrders) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have active ongoing orders. Please complete or cancel them before deleting your account.' 
      });
    }

    user.full_name = 'Deleted User';
    user.email = `deleted_${Date.now()}_${userId}@dealit.in`; 
    user.phone = '0000000000';
    user.city = 'Deleted';
    user.pickupAddress = {}; 
    user.savedAddresses = [];
    user.password = ''; 
    user.profilePic = ''; 
    user.account_credits = 0; 
    user.aura_points = 0;
    user.listedProductsCount = 0;
    user.rewardedListingsCount = 0; 
    user.referralCode = `DEL_${Date.now()}`;
    user.otp = undefined;
    user.resetPasswordOtp = undefined;
    
    user.isDeleted = true; 
    user.updated_at = Date.now();
    
    await user.save({ validateBeforeSave: false }); 

    await Item.updateMany(
      { owner: userId, status: { $in: ['active', 'pending'] } },
      { $set: { status: 'rejected', rejection_reason: 'Account Deleted by User', updated_at: Date.now() } }
    );

    await BarterRequest.updateMany(
      { $or: [{ requester: userId }, { owner: userId }], status: 'PENDING' },
      { $set: { status: 'CANCELLED', updated_at: Date.now() } }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax'
    });

    res.status(200).json({ success: true, message: 'Account permanently deleted and data anonymized.' });

  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ success: false, message: 'Server Error during account deletion' });
  }
};


const getRandomAvatars = async (req, res) => {
  try {
    const randomUsers = await User.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $sample: { size: 5 } },
      { $project: { profilePic: 1, full_name: 1 } }
    ]);

    const avatars = randomUsers.map((u, i) => {
      if (u.profilePic) return u.profilePic;
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'User')}&background=A388E1&color=fff&size=40`;
    });

    while(avatars.length < 5) {
       avatars.push(`https://ui-avatars.com/api/?name=U${avatars.length}&background=A388E1&color=fff&size=40`);
    }

    res.status(200).json({ success: true, data: avatars });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error fetching avatars' });
  }
};

const syncRecentlyViewed = async (req, res) => {
  try {
    const { viewedIds } = req.body;
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  
    let combined = [...(viewedIds || []), ...user.recently_viewed.map(id => id.toString())];
    
    combined = [...new Set(combined)];
    
    if (combined.length > 20) {
      combined = combined.slice(0, 20);
    }

    user.recently_viewed = combined;
    await user.save();

    res.status(200).json({ success: true, data: combined });
  } catch (error) {
    console.error('Error syncing recently viewed:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const clearRecentlyViewed = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const user = await User.findById(req.user._id);
    if (user) {
      user.recently_viewed = [];
      await user.save();
    }

    res.status(200).json({ success: true, message: 'History cleared' });
  } catch (error) {
    console.error('Error clearing recently viewed:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  registerUser,
  verifyOtp, 
  loginUser,
  googleLogin, 
  logoutUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile, 
  updateProfilePic,
  toggleWishlist,
  getWishlist,
  claimWelcomeBonus,
  deleteUserProfile ,
  getUserStats,
  getRandomAvatars ,
  syncRecentlyViewed, 
  clearRecentlyViewed
};
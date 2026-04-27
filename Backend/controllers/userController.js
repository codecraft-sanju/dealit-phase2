const User = require('../models/User');
const CreditSetting = require('../models/CreditSetting'); 
const Notification = require('../models/Notification');
const AuraLog = require('../models/AuraLog'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

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

  console.log('[DEBUG] Setting token cookie for user:', user.email);
  
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    message,
    token: token, 
    user: { 
      id: user._id, 
      full_name: user.full_name, 
      email: user.email, 
      role: user.role,
      account_credits: user.account_credits,
      aura_points: user.aura_points, 
      hasClaimedWelcomeBonus: user.hasClaimedWelcomeBonus, 
      referralCode: user.referralCode,
      totalReferrals: user.totalReferrals ,
      listedProductsCount: user.listedProductsCount || 0
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
    let { full_name, email, password, phone, city, referralCode } = req.body;
    if (email) email = email.toLowerCase().trim();
    
    const isOtpEnabled = process.env.ENABLE_OTP === 'true'; 

    let user = await User.findOne({ email });
    
    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      } else {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.full_name = full_name;
        user.phone = phone;
        user.city = city;
        if (!isOtpEnabled) {
          user.isVerified = true;
        }
      }
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const newReferralCode = await generateUniqueReferralCode(full_name);

      user = new User({
        full_name,
        email,
        password: hashedPassword,
        phone,
        city,
        isVerified: !isOtpEnabled,
        referralCode: newReferralCode 
      });

      if (referralCode) {
        const cleanReferralCode = referralCode.toUpperCase().trim();
        const referrer = await User.findOne({ referralCode: cleanReferralCode });
        
        if (referrer) {
          let setting = await CreditSetting.findOne();
          if (!setting) {
            setting = { 
              isReferralSystemEnabled: true, 
              referralRewardCredits: 40,
              maxReferralLimit: 5,
              milestoneReferralReward: 100
            };
          }

          if (setting.isReferralSystemEnabled) {
            if (referrer.totalReferrals < setting.maxReferralLimit) {
              user.referredBy = referrer._id; 
              referrer.totalReferrals += 1;   

              if (referrer.totalReferrals === 1) {
                referrer.account_credits += setting.referralRewardCredits;
                referrer.aura_points = (referrer.aura_points || 0) + 20; // ⚡ NAYA: +20 Aura for successful referral
                
                await Notification.create({
                  user: referrer._id,
                  type: 'CREDIT_ADDED',
                  title: 'Referral Bonus! ',
                  message: `A new user joined using your code. You have received ${setting.referralRewardCredits} credits and 20 Aura points.`,
                  metadata: { amount: setting.referralRewardCredits, reason: 'referral_bonus' }
                });

           
                await AuraLog.create({
                  user: referrer._id,
                  reason: "Successful Referral",
                  points: 20,
                  type: "positive"
                });

              } else if (referrer.totalReferrals === setting.maxReferralLimit) {
                referrer.account_credits += setting.milestoneReferralReward;
                referrer.aura_points = (referrer.aura_points || 0) + 50; // ⚡ NAYA: +50 Aura for Milestone
                
                await Notification.create({
                  user: referrer._id,
                  type: 'CREDIT_ADDED',
                  title: 'Milestone Unlocked! 🚀',
                  message: `You have completed max referrals. ${setting.milestoneReferralReward} bonus credits and 50 Aura points added.`,
                  metadata: { amount: setting.milestoneReferralReward, reason: 'milestone_bonus' }
                });

                // ⚡ NAYA: Aura Log for Milestone
                await AuraLog.create({
                  user: referrer._id,
                  reason: "Referral Milestone Unlocked",
                  points: 50,
                  type: "positive"
                });
              }

              await referrer.save();
            }
          }
        }
      }
    }

    if (isOtpEnabled) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpiry = Date.now() + 10 * 60 * 1000; 

      await user.save();

      const message = `Hi ${full_name},\n\nYour OTP for Dealit registration is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nRegards,\nTeam Dealit`;
      
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
    } else {
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();
      
      return sendTokenResponse(user, 201, res, 'Registration successful!');
    }

  } catch (error) {
    console.error(error);
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

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account is already verified. Please login.' });
    }

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Account verified and logged in successfully!');

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error during OTP verification' });
  }
};

const loginUser = async (req, res) => {
  console.log('[DEBUG] Login attempt for email:', req.body.email);
  
  try {
    let { email, password } = req.body;
    if (email) email = email.toLowerCase().trim();

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      if (user.otp === undefined && user.password) {
        user.isVerified = true;
        await user.save();
      } else {
        return res.status(403).json({ success: false, message: 'Please verify your email first. Register again to get a new OTP.' });
      }
    }

    if (!user.password) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are using an older account. Please use "Forgot Password" to set a new password.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res, 'Login successful!');

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error during login' });
  }
};

const logoutUser = (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  console.log('[DEBUG] Logging out user, clearing cookie');

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

      console.error(error);
      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (error) {
    console.error(error);
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
    console.error(error);
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
    console.error('[DEBUG] Error in getUserProfile:', error);
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
        addressLine: pickupAddress.addressLine || user.pickupAddress?.addressLine,
        city: pickupAddress.city || user.pickupAddress?.city,
        state: pickupAddress.state || user.pickupAddress?.state,
        pincode: pickupAddress.pincode || user.pickupAddress?.pincode,
      };
    }

    user.updated_at = Date.now();
    await user.save();

    res.status(200).json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    res.status(500).json({ success: false, message: 'Server Error updating profile' });
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
    console.error('[DEBUG] Error in updateProfilePic:', error);
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
    console.error('[DEBUG] Error in toggleWishlist:', error);
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
    console.error('[DEBUG] Error in getWishlist:', error);
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

    // Credits & Aura Update
    user.account_credits += amount;
    user.aura_points = (user.aura_points || 0) + 50; //  NAYA: Welcome bonus par +50 Aura
    user.hasClaimedWelcomeBonus = true;
    await user.save();

    await Notification.create({
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
    console.error('[DEBUG] Error in claimWelcomeBonus:', error);
    res.status(500).json({ success: false, message: 'Server Error while claiming bonus' });
  }
};

module.exports = {
  registerUser,
  verifyOtp, 
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile, 
  updateProfilePic,
  toggleWishlist,
  getWishlist,
  claimWelcomeBonus 
};
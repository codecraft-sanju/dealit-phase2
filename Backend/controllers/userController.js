const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const sendTokenResponse = (user, statusCode, res, message) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d' 
  });

  const isProduction = process.env.NODE_ENV === 'production';

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true, 
    secure: isProduction, 
    sameSite: isProduction ? 'none' : 'lax' 
  };

  // NAYA DEBUG: Cookie options check karne ke liye ki production me sahi set ho raha hai ya nahi
  console.log('[DEBUG] Setting token cookie for user:', user.email);
  console.log('[DEBUG] Environment:', process.env.NODE_ENV);
  console.log('[DEBUG] Cookie Options:', options);

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    message,
    token: token, // <--- YE LINE ADD KARNA BAHUT ZARURI THA! Iske bina frontend header auth nahi kar sakta.
    user: { 
      id: user._id, 
      full_name: user.full_name, 
      email: user.email, 
      role: user.role,
      account_credits: user.account_credits 
    }
  });
};

const registerUser = async (req, res) => {
  try {
    const { full_name, email, password, phone, city } = req.body;
    
    // NAYA: Check if OTP is enabled in .env
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
        
        // Agar OTP disabled hai, toh automatically verify kardo
        if (!isOtpEnabled) {
          user.isVerified = true;
        }
      }
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({
        full_name,
        email,
        password: hashedPassword,
        phone,
        city,
        // Agar OTP disabled hai, toh directly true save hoga
        isVerified: !isOtpEnabled 
      });
    }

    // --- LOGIC SPLIT: OTP ENABLED VS DISABLED ---
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
        requiresOtp: true, // NAYA: Frontend ko batane ke liye ki OTP chahiye
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
    const { email, otp } = req.body;

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
  // NAYA DEBUG
  console.log('[DEBUG] Login attempt for email:', req.body.email);
  
  try {
    const { email, password } = req.body;

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
    const { email } = req.body;
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
    const { email, otp, newPassword } = req.body;

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
  console.log('[DEBUG] GET /profile called');
  console.log('[DEBUG] req.user object from middleware:', req.user ? `Found user ${req.user._id}` : 'UNDEFINED! Middleware failed or no cookie received.');

  try {
    if (!req.user || !req.user._id) {
       console.log('[DEBUG] Aborting: req.user is missing');
       return res.status(401).json({ success: false, message: 'Not authorized, no user data found in request' });
    }

    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      console.log('[DEBUG] User not found in database for ID:', req.user._id);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log('[DEBUG] Profile fetched successfully for:', user.email);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('[DEBUG] Error in getUserProfile:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching profile' });
  }
};

const updateProfilePic = async (req, res) => {
  console.log('[DEBUG] PUT /profile-pic called');
  console.log('[DEBUG] Incoming req.body:', req.body);
  console.log('[DEBUG] req.user from middleware:', req.user ? `Found user ${req.user._id}` : 'UNDEFINED! Cookie missing on iOS.');

  try {
    const { profilePic } = req.body;
    
    if (!profilePic) {
      console.log('[DEBUG] Error: No profilePic URL provided in body');
      return res.status(400).json({ success: false, message: 'Please provide an image URL' });
    }

    if (!req.user || !req.user._id) {
      console.log('[DEBUG] Aborting update: req.user is missing');
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: profilePic, updated_at: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      console.log('[DEBUG] User not found in DB during update');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('[DEBUG] Profile pic updated successfully');
    res.status(200).json({ success: true, message: 'Profile picture updated', data: user });
  } catch (error) {
    console.error('[DEBUG] Error in updateProfilePic:', error);
    res.status(500).json({ success: false, message: 'Server Error updating profile pic' });
  }
};

// CHANGE START: Wishlist Functions
const toggleWishlist = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if the item is already in the wishlist
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
      match: { status: 'active' }, // Only fetch items that are still active
      populate: { path: 'owner', select: 'full_name city profilePic' } // Get owner details inside the item
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


module.exports = {
  registerUser,
  verifyOtp, 
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateProfilePic,

  toggleWishlist,
  getWishlist

};
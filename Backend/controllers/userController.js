const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const sendTokenResponse = (user, statusCode, res, message) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d' 
  });

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true, 
    // Localhost par smoothly chalne ke liye isko simple rakha hai.
    sameSite: 'lax' 
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    message,
    // role add kar diya hai taaki frontend check kar sake ki admin hai ya normal user
    user: { id: user._id, full_name: user.full_name, email: user.email, role: user.role }
  });
};

const registerUser = async (req, res) => {
  try {
    const { full_name, email, password, phone, city } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      full_name,
      email,
      password: hashedPassword,
      phone,
      city
    });

    await user.save();
    sendTokenResponse(user, 201, res, 'Registration successful!');

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error during registration' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
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
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
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

// NAYA FUNCTION: User ki puri profile detail lane ke liye
const getUserProfile = async (req, res) => {
  try {
    // req.user._id protect middleware se aayega
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error fetching profile' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  getUserProfile // NAYA: Export kiya
};
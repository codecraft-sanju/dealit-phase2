const express = require('express');
const router = express.Router();

const { 
  registerUser, 
  verifyOtp,
  loginUser, 
  logoutUser, 
  forgotPassword, 
  resetPassword, 
  getUserProfile,
  updateProfilePic,
  toggleWishlist,
  getWishlist,
  claimWelcomeBonus 
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/forgotpassword', forgotPassword);
router.post('/resetpassword', resetPassword);

router.get('/profile', protect, getUserProfile);
router.put('/profile-pic', protect, updateProfilePic);

router.post('/wishlist/:itemId', protect, toggleWishlist);
router.get('/wishlist', protect, getWishlist);
router.post('/claim-bonus', protect, claimWelcomeBonus);

module.exports = router;
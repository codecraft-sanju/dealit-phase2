const express = require('express');
const router = express.Router();

const rateLimit = require('express-rate-limit');

const { 
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
  deleteUserProfile,
 
  getUserStats

} = require('../controllers/userController');


const { getUserAura, getLeaderboard, getAuraHistory } = require('../controllers/auraLogController');

const { protect } = require('../middleware/authMiddleware');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: {
    success: false,
    message: 'Too many attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, registerUser);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/login', authLimiter, loginUser);

router.post('/google-login', authLimiter, googleLogin);
router.post('/logout', logoutUser); 
router.post('/forgotpassword', authLimiter, forgotPassword);
router.post('/resetpassword', authLimiter, resetPassword);

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile); 
router.delete('/profile', protect, deleteUserProfile);
router.put('/profile-pic', protect, updateProfilePic);

router.post('/wishlist/:itemId', protect, toggleWishlist);
router.get('/wishlist', protect, getWishlist);
router.post('/claim-bonus', protect, claimWelcomeBonus);


router.get('/stats', protect, getUserStats);


router.get('/aura', protect, getUserAura);
router.get('/aura/history', protect, getAuraHistory);
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;
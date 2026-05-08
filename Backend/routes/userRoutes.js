const express = require('express');
const router = express.Router();
// --- NAYA CHANGE START: Import rate limit ---
const rateLimit = require('express-rate-limit');
// --- NAYA CHANGE END ---

const { 
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
  claimWelcomeBonus,
 
  deleteUserProfile

} = require('../controllers/userController');


const { getUserAura, getLeaderboard, getAuraHistory } = require('../controllers/auraLogController');

const { protect } = require('../middleware/authMiddleware');


// Sirf auth routes (login, register, otp) ke liye strict limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes ka time window
  max: 10, // 15 minute mein maximum 10 requests allowed hain ek IP se
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
router.post('/logout', logoutUser); // Logout pe limit itni zaroori nahi, par rakh sakte ho
router.post('/forgotpassword', authLimiter, forgotPassword);
router.post('/resetpassword', authLimiter, resetPassword);


router.get('/profile', protect, getUserProfile);

router.put('/profile', protect, updateUserProfile); 


router.delete('/profile', protect, deleteUserProfile);


router.put('/profile-pic', protect, updateProfilePic);

router.post('/wishlist/:itemId', protect, toggleWishlist);
router.get('/wishlist', protect, getWishlist);
router.post('/claim-bonus', protect, claimWelcomeBonus);


router.get('/aura', protect, getUserAura);

router.get('/aura/history', protect, getAuraHistory);
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;
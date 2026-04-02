const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

 
    console.log('[DEBUG] --- PROTECT MIDDLEWARE HIT ---');
    console.log('[DEBUG] Route:', req.originalUrl);
    console.log('[DEBUG] Auth Header:', req.headers.authorization ? 'Present' : 'Missing');

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('[DEBUG] Token successfully extracted from Header');
    } 
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log('[DEBUG] Token extracted from Cookie');
    }

    if (!token) {
      console.log('[DEBUG] REJECTED: No token found in Header or Cookie');
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      console.log('[DEBUG] REJECTED: User not found in database for ID:', decoded.id);
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    console.log('[DEBUG] Middleware passed for user:', req.user.email);
    next();
  } catch (error) {
    console.error('[DEBUG] Token Verification Failed:', error.message);
    res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };
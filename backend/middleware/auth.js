const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Authentication middleware - verifies JWT token
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted (user logged out)
    const blacklisted = db.prepare(
      'SELECT id FROM token_blacklist WHERE token = ?'
    ).get(token);

    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated. Please login again.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

/**
 * Admin authorization middleware - checks if user has system_admin role
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'system_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

module.exports = { authenticate, requireAdmin };

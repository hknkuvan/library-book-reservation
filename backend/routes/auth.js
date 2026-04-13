const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { registerValidation, loginValidation, updateProfileValidation } = require('../middleware/validate');
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  deleteAccount
} = require('../controllers/authController');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes (require authentication)
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfileValidation, updateProfile);
router.delete('/profile', authenticate, deleteAccount);

module.exports = router;

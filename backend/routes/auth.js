const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { registerValidation, loginValidation, updateProfileValidation, forgotPasswordValidation, resetPasswordValidation } = require('../middleware/validate');
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  deleteAccount
} = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/passwordController');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);

// Protected routes (require authentication)
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfileValidation, updateProfile);
router.delete('/profile', authenticate, deleteAccount);

module.exports = router;

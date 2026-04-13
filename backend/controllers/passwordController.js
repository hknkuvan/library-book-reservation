const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');

/**
 * Forgot Password - Generate reset token
 * POST /api/auth/forgot-password
 */
const forgotPassword = (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array().map(err => err.msg)
      });
    }

    const { email } = req.body;

    // Check if user exists
    const user = User.findByEmail(email);
    if (!user) {
      // Don't reveal whether email exists - still return success
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const token = PasswordReset.create(email);

    // In a real app, this would send an email
    // For demo purposes, we'll return the token and log it
    const resetUrl = `http://localhost:5173/reset-password?token=${token}`;
    console.log(`\n📧 Password Reset Request:`);
    console.log(`   Email: ${email}`);
    console.log(`   Reset URL: ${resetUrl}`);
    console.log(`   Token: ${token}\n`);

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Include reset URL in response for demo (remove in production)
      resetUrl,
      token
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again.'
    });
  }
};

/**
 * Reset Password - Use token to set new password
 * POST /api/auth/reset-password
 */
const resetPassword = (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array().map(err => err.msg)
      });
    }

    const { token, password } = req.body;

    // Find valid token
    const resetRecord = PasswordReset.findByToken(token);
    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new password reset.'
      });
    }

    // Find user by email
    const user = User.findByEmail(resetRecord.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Hash new password and update
    const hashedPassword = bcrypt.hashSync(password, 12);
    User.update(user.id, { password: hashedPassword });

    // Mark token as used
    PasswordReset.markUsed(token);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while resetting password. Please try again.'
    });
  }
};

module.exports = { forgotPassword, resetPassword };

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const db = require('../config/db');

/**
 * Register a new user
 * POST /api/auth/register
 * No password in form — user receives an email link to set their password.
 */
const register = (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array().map(err => err.msg)
      });
    }

    const { first_name, last_name, email, phone, birth_date, birth_country, birth_city, gender, address } = req.body;

    // Check if email already exists
    const existingUser = User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Create user with end_user role — password is NULL until set via link
    const user = User.create({
      first_name, last_name, email,
      password: null,
      phone: phone || null,
      birth_date, birth_country, birth_city, gender,
      address: address || null,
      role: 'end_user'
    });

    // Generate a set-password token (reuses the password_resets table)
    const token = PasswordReset.create(email);
    const setPasswordUrl = `http://localhost:5173/reset-password?token=${token}`;

    console.log(`\n📧 New Registration - Set Password Link:`);
    console.log(`   User: ${first_name} ${last_name} <${email}>`);
    console.log(`   Set Password URL: ${setPasswordUrl}\n`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to set your password.',
      // Included for demo — remove in production
      setPasswordUrl
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration. Please try again.'
    });
  }
};

/**
 * Login user (both admin and end user)
 * POST /api/auth/login
 */
const login = (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array().map(err => err.msg)
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check if user has set a password yet (new registrations start with null)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Password not set. Please check your email for the link to create your password.'
      });
    }

    // Check password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.'
    });
  }
};

/**
 * Logout user (blacklist token)
 * POST /api/auth/logout
 */
const logout = (req, res) => {
  try {
    const token = req.token;

    // Decode token to get expiry
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000).toISOString();

    // Add token to blacklist
    db.prepare(
      'INSERT INTO token_blacklist (token, expires_at) VALUES (?, ?)'
    ).run(token, expiresAt);

    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during logout. Please try again.'
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 */
const getProfile = (req, res) => {
  try {
    const user = User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching profile.'
    });
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array().map(err => err.msg)
      });
    }

    const { first_name, last_name, email, password, phone } = req.body;
    const userId = req.user.id;

    // If email is being changed, check if it's already taken
    if (email) {
      const emailTaken = User.isEmailTaken(email, userId);
      if (emailTaken) {
        return res.status(409).json({
          success: false,
          message: 'This email is already in use by another account.'
        });
      }
    }

    // Build update fields
    const updateFields = {};
    if (first_name) updateFields.first_name = first_name;
    if (last_name) updateFields.last_name = last_name;
    if (email) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (password) {
      updateFields.password = bcrypt.hashSync(password, 12);
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.'
      });
    }

    const updatedUser = User.update(userId, updateFields);
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating profile. Please try again.'
    });
  }
};

/**
 * Delete user account
 * DELETE /api/auth/profile
 */
const deleteAccount = (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.token;

    // Delete the user
    const deleted = User.delete(userId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Account deletion failed. User not found.'
      });
    }

    // Blacklist the current token
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000).toISOString();
    db.prepare(
      'INSERT INTO token_blacklist (token, expires_at) VALUES (?, ?)'
    ).run(token, expiresAt);

    res.json({
      success: true,
      message: 'Account deleted successfully.'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting account. Please try again.'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  deleteAccount
};

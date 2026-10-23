const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * Generate signed JWT Token
 */
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secure_jwt_secret_key_financial_fraud_2026',
    { expiresIn: '7d' }
  );
};

// @desc    Register a new customer account
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, role, upiPin, upiId } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, phone, password'
      });
    }

    // Validate password match if confirmPassword was passed
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length'
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    // Default role to customer
    const userRole = role === 'admin' ? 'admin' : 'customer';
    const cleanUpiId = upiId?.trim() || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@okhdfcbank`;
    const cleanUpiPin = upiPin?.trim() || '1234';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: userRole,
      upiId: cleanUpiId,
      upiPin: cleanUpiPin
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        upiId: user.upiId,
        upiPin: user.upiPin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('[AuthController] Register error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// @desc    Authenticate user and get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        upiId: user.upiId || `${user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@okhdfcbank`,
        upiPin: user.upiPin || '1234',
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('[AuthController] Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        upiId: user.upiId || `${user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@okhdfcbank`,
        upiPin: user.upiPin || '1234',
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('[AuthController] GetProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving profile'
    });
  }
};

// @desc    Update user profile & optional password change
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { name, phone, currentPassword, newPassword, upiId, upiPin } = req.body;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (upiId) user.upiId = upiId.trim();
    if (upiPin && upiPin.trim().length === 4 && !isNaN(upiPin)) user.upiPin = upiPin.trim();

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password'
        });
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect current password'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters'
        });
      }

      user.password = newPassword;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        upiId: user.upiId || `${user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@okhdfcbank`,
        upiPin: user.upiPin || '1234',
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('[AuthController] UpdateProfile error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};

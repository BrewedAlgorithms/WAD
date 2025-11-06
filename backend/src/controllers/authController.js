const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../utils/logger');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register new user
const register = async (req, res) => {
  logger.info('Registration attempt started', { body: req.body });
  try {
    const { email, password, firstName, lastName, institution, researchInterests } = req.body;

    // Check if user already exists
    logger.info(`Checking if user exists with email: ${email}`);
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      logger.warn(`Registration failed: User already exists with email: ${email}`);
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    // Create new user
    logger.info(`Creating new user with email: ${email}`);
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      institution,
      researchInterests: researchInterests || []
    });

    await user.save();
    logger.info(`User created successfully with ID: ${user._id}`);

    // Generate token
    const token = generateToken(user._id);
    logger.info(`JWT token generated for user: ${user._id}`);

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.getPublicProfile(),
        token
      }
    });
  } catch (error) {
    logger.error('Registration error:', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'Failed to register user'
      }
    });
  }
};

// Login user
const login = async (req, res) => {
  logger.info('Login attempt started', { body: req.body });
  try {
    const { email, password } = req.body;

    // Find user by email
    logger.info(`Finding user by email: ${email}`);
    const user = await User.findByEmail(email);
    if (!user) {
      logger.warn(`Login failed: User not found with email: ${email}`);
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Check if user is active
    logger.info(`Checking if user is active: ${email}`);
    if (!user.isActive) {
      logger.warn(`Login failed: Account disabled for user: ${email}`);
      return res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Account is disabled'
        }
      });
    }

    // Verify password
    logger.info(`Verifying password for user: ${email}`);
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Login failed: Invalid password for user: ${email}`);
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Generate token
    const token = generateToken(user._id);
    logger.info(`JWT token generated for user: ${user._id}`);

    // Update last login without triggering password hashing
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.getPublicProfile(),
        token
      }
    });
  } catch (error) {
    logger.error('Login error:', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: 'Failed to login'
      }
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  logger.info(`Get profile request for user ID: ${req.user._id}`);
  try {
    const user = await User.findById(req.user._id)
      .populate('uploadedPapers', 'title uploadedAt')
      .select('-password');

    if (!user) {
      logger.warn(`Get profile failed: User not found with ID: ${req.user._id}`);
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    logger.info(`Profile retrieved successfully for user: ${user.email}`);
    res.json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    logger.error('Get profile error:', { error, userId: req.user._id });
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_FETCH_FAILED',
        message: 'Failed to fetch profile'
      }
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  logger.info(`Update profile request for user ID: ${req.user._id}`, { body: req.body });
  try {
    const { firstName, lastName, institution, researchInterests } = req.body;
    
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (institution !== undefined) updateData.institution = institution;
    if (researchInterests) updateData.researchInterests = researchInterests;

    logger.info(`Updating profile for user ID: ${req.user._id} with data:`, updateData);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      logger.warn(`Update profile failed: User not found with ID: ${req.user._id}`);
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    logger.info(`Profile updated for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    logger.error('Update profile error:', { error, userId: req.user._id, body: req.body });
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_UPDATE_FAILED',
        message: 'Failed to update profile'
      }
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  logger.info(`Change password request for user ID: ${req.user._id}`);
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      logger.warn(`Change password failed: User not found with ID: ${req.user._id}`);
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Verify current password
    logger.info(`Verifying current password for user: ${user.email}`);
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      logger.warn(`Change password failed: Invalid current password for user: ${user.email}`);
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect'
        }
      });
    }

    // Update password
    logger.info(`Updating password for user: ${user.email}`);
    user.password = newPassword;
    await user.save();
    logger.info(`Password changed successfully for user: ${user.email}`);

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', { error, userId: req.user._id });
    res.status(500).json({
      success: false,
      error: {
        code: 'PASSWORD_CHANGE_FAILED',
        message: 'Failed to change password'
      }
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
}; 
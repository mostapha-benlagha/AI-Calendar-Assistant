const express = require('express');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateToken, generateRefreshToken, authenticateToken } = require('../middlewares/auth');
const config = require('../config');
const logger = require('../utils/logger');

// Import passport configuration
require('../config/passport');

const router = express.Router();

// Configure session middleware
router.use(session({
  secret: config.session.secret,
  resave: config.session.resave,
  saveUninitialized: config.session.saveUninitialized,
  store: MongoStore.create({
    mongoUrl: config.mongodb.uri,
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: config.session.cookie
}));

// Initialize Passport
router.use(passport.initialize());
router.use(passport.session());

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
    accessType: 'offline',
    prompt: 'consent'
  })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=auth_failed' }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${config.cors.origin}/login?error=auth_failed`);
      }

      // Generate tokens
      const token = generateToken(req.user._id);
      const refreshToken = generateRefreshToken(req.user._id);

      // Redirect to frontend with tokens
      const redirectUrl = `${config.cors.origin}/auth/callback?token=${token}&refresh=${refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('OAuth callback error:', error);
      res.redirect(`${config.cors.origin}/login?error=server_error`);
    }
  }
);

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-calendarKeys.accessToken -calendarKeys.refreshToken');
    
    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        isCalendarConnected: user.isCalendarConnected()
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        message: 'Profile updated successfully'
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    const decoded = jwt.verify(refreshToken, config.jwt.secret);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// Check calendar connection status
router.get('/calendar/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: {
        isConnected: user.isCalendarConnected(),
        calendarId: user.calendarKeys.calendarId,
        tokenExpiry: user.calendarKeys.tokenExpiry
      }
    });
  } catch (error) {
    logger.error('Calendar status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get calendar status'
    });
  }
});

// Disconnect calendar
router.post('/calendar/disconnect', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.calendarKeys.accessToken = null;
    user.calendarKeys.refreshToken = null;
    user.calendarKeys.tokenExpiry = null;
    
    await user.save();

    res.json({
      success: true,
      message: 'Calendar disconnected successfully'
    });
  } catch (error) {
    logger.error('Calendar disconnect error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect calendar'
    });
  }
});

// Get user's chat sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: {
        sessions: user.chatSessions.map(session => ({
          sessionId: session.sessionId,
          messageCount: session.messages.length,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt
        }))
      }
    });
  } catch (error) {
    logger.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat sessions'
    });
  }
});

module.exports = router;

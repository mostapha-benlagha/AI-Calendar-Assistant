const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const config = require('./index');
const logger = require('../utils/logger');

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: config.google.clientId,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.redirectUri,
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    logger.info('Google OAuth callback received', {
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName
    });

    // Check if user already exists
    let user = await User.findByGoogleId(profile.id);
    
    if (user) {
      // Update existing user's calendar keys and last login
      user.calendarKeys.accessToken = accessToken;
      user.calendarKeys.refreshToken = refreshToken;
      user.calendarKeys.tokenExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour from now
      user.lastLogin = new Date();
      user.picture = profile.photos[0]?.value || user.picture;
      
      await user.save();
      logger.info('Existing user updated', { userId: user._id, email: user.email });
    } else {
      // Check if user exists with same email
      const existingUser = await User.findByEmail(profile.emails[0].value);
      
      if (existingUser) {
        // Link Google account to existing user
        existingUser.googleId = profile.id;
        existingUser.calendarKeys.accessToken = accessToken;
        existingUser.calendarKeys.refreshToken = refreshToken;
        existingUser.calendarKeys.tokenExpiry = new Date(Date.now() + 3600 * 1000);
        existingUser.lastLogin = new Date();
        existingUser.picture = profile.photos[0]?.value || existingUser.picture;
        
        await existingUser.save();
        user = existingUser;
        logger.info('Google account linked to existing user', { userId: user._id, email: user.email });
      } else {
        // Create new user
        user = new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          picture: profile.photos[0]?.value,
          calendarKeys: {
            accessToken,
            refreshToken,
            tokenExpiry: new Date(Date.now() + 3600 * 1000),
            calendarId: 'primary'
          },
          lastLogin: new Date()
        });
        
        await user.save();
        logger.info('New user created', { userId: user._id, email: user.email });
      }
    }

    return done(null, user);
  } catch (error) {
    logger.error('Error in Google OAuth strategy:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    logger.error('Error deserializing user:', error);
    done(error, null);
  }
});

module.exports = passport;

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  picture: {
    type: String,
    default: null
  },
  // Calendar integration keys
  calendarKeys: {
    accessToken: {
      type: String,
      default: null
    },
    refreshToken: {
      type: String,
      default: null
    },
    tokenExpiry: {
      type: Date,
      default: null
    },
    calendarId: {
      type: String,
      default: 'primary'
    }
  },
  // User preferences
  preferences: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      calendar: {
        type: Boolean,
        default: true
      }
    }
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  // Chat session data
  chatSessions: [{
    sessionId: {
      type: String,
      required: true
    },
    messages: [{
      role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
      },
      content: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ 'chatSessions.sessionId': 1 });

// Virtual for user's full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Method to update calendar keys
userSchema.methods.updateCalendarKeys = function(accessToken, refreshToken, tokenExpiry) {
  this.calendarKeys.accessToken = accessToken;
  this.calendarKeys.refreshToken = refreshToken;
  this.calendarKeys.tokenExpiry = tokenExpiry;
  return this.save();
};

// Method to check if calendar is connected
userSchema.methods.isCalendarConnected = function() {
  return !!(this.calendarKeys.accessToken && this.calendarKeys.refreshToken);
};

// Method to get active chat session
userSchema.methods.getActiveSession = function() {
  return this.chatSessions.find(session => 
    session.updatedAt > new Date(Date.now() - 30 * 60 * 1000) // Active within last 30 minutes
  );
};

// Method to create new chat session
userSchema.methods.createChatSession = function() {
  const sessionId = require('uuid').v4();
  const newSession = {
    sessionId,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  this.chatSessions.push(newSession);
  return this.save().then(() => newSession);
};

// Method to add message to chat session
userSchema.methods.addMessageToSession = function(sessionId, role, content) {
  const session = this.chatSessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.messages.push({
      role,
      content,
      timestamp: new Date()
    });
    session.updatedAt = new Date();
    return this.save();
  }
  throw new Error('Session not found');
};

// Static method to find user by Google ID
userSchema.statics.findByGoogleId = function(googleId) {
  return this.findOne({ googleId });
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Pre-save middleware to update lastLogin
userSchema.pre('save', function(next) {
  if (this.isModified('lastLogin')) {
    this.lastLogin = new Date();
  }
  next();
});

// Transform JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.calendarKeys.accessToken;
  delete user.calendarKeys.refreshToken;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);

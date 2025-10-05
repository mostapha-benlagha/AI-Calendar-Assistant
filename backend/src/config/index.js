require("dotenv").config();

const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",

  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/chatbot-app",
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || "your-jwt-secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  // Gemini API Configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    apiUrl:
      process.env.GEMINI_API_URL ||
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
  },

  qwen: {
    apiKey: process.env.QWEN_API_KEY,
    apiUrl:
      process.env.QWEN_API_URL ||
      "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    model: process.env.QWEN_MODEL || "qwen-max-latest",
  },

  // Google OAuth Configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:3001/api/auth/google/callback",
    calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
  },

  // CORS Configuration
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
};

// Validate required environment variables
const requiredEnvVars = [
  "QWEN_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(
      `Warning: ${envVar} is not set. Some features may not work properly.`
    );
  }
}

module.exports = config;

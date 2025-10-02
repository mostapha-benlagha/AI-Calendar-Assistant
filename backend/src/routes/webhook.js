const express = require('express');
const rateLimit = require('express-rate-limit');
const { handleWebhook, healthCheck } = require('../controllers/webhookController');
const { optionalAuth } = require('../middlewares/auth');
const config = require('../config');

const router = express.Router();

// Rate limiting for webhook endpoint
const webhookRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Please wait before sending another message.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting and optional auth to webhook endpoint
router.post('/webhook', webhookRateLimit, optionalAuth, handleWebhook);

// Note: Google OAuth routes are handled in /api/auth routes

// Health check endpoint
router.get('/health', healthCheck);

module.exports = router;


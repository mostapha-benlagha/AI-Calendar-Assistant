const Joi = require('joi');

// Common validation schemas
const schemas = {
  // Webhook request validation
  webhookRequest: Joi.object({
    text: Joi.string().required().min(1).max(1000).trim(),
    userId: Joi.string().required().min(1).max(100).trim()
  }),

  // Event data validation
  eventData: Joi.object({
    title: Joi.string().min(1).max(200).trim(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    duration: Joi.number().integer().min(1).max(1440), // Max 24 hours
    location: Joi.string().max(500).trim(),
    attendees: Joi.array().items(Joi.string().email()).max(50),
    description: Joi.string().max(2000).trim(),
    followupDays: Joi.number().integer().min(1).max(365),
    event_identifier: Joi.string().min(1).max(200).trim()
  }),

  // Intent extraction result validation
  intentResult: Joi.object({
    intent: Joi.string().required(),
    confidence: Joi.number().min(0).max(1).required(),
    fields: Joi.object().required()
  }),

  // Google OAuth callback validation
  oauthCallback: Joi.object({
    code: Joi.string().required(),
    state: Joi.string().optional()
  })
};

/**
 * Validate data against a schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Joi schema
 * @returns {Object} - { error, value }
 */
const validate = (data, schema) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  return { error, value };
};

/**
 * Validate webhook request
 * @param {Object} data - Request data
 * @returns {Object} - { error, value }
 */
const validateWebhookRequest = (data) => {
  return validate(data, schemas.webhookRequest);
};

/**
 * Validate event data
 * @param {Object} data - Event data
 * @returns {Object} - { error, value }
 */
const validateEventData = (data) => {
  return validate(data, schemas.eventData);
};

/**
 * Validate intent result
 * @param {Object} data - Intent result
 * @returns {Object} - { error, value }
 */
const validateIntentResult = (data) => {
  return validate(data, schemas.intentResult);
};

/**
 * Validate OAuth callback
 * @param {Object} data - OAuth callback data
 * @returns {Object} - { error, value }
 */
const validateOAuthCallback = (data) => {
  return validate(data, schemas.oauthCallback);
};

/**
 * Sanitize user input
 * @param {string} input - User input
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

/**
 * Validate email address
 * @param {string} email - Email address
 * @returns {boolean} - Is valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string
 * @returns {boolean} - Is valid date format
 */
const isValidDateFormat = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate);
};

/**
 * Validate time format (HH:MM)
 * @param {string} time - Time string
 * @returns {boolean} - Is valid time format
 */
const isValidTimeFormat = (time) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

module.exports = {
  schemas,
  validate,
  validateWebhookRequest,
  validateEventData,
  validateIntentResult,
  validateOAuthCallback,
  sanitizeInput,
  isValidEmail,
  isValidDateFormat,
  isValidTimeFormat
};
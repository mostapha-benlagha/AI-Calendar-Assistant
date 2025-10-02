// API Response Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Error Messages
const ERROR_MESSAGES = {
  INVALID_REQUEST: 'Invalid request format',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  INVALID_CREDENTIALS: 'Invalid credentials',
  UNAUTHORIZED_ACCESS: 'Unauthorized access',
  RESOURCE_NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  VALIDATION_ERROR: 'Validation error',
  GEMINI_API_ERROR: 'Gemini API error',
  CALENDAR_API_ERROR: 'Google Calendar API error',
  CONNECTION_ERROR: 'Connection error',
  TIMEOUT_ERROR: 'Request timeout'
};

// Success Messages
const SUCCESS_MESSAGES = {
  EVENT_CREATED: 'Event created successfully',
  EVENT_UPDATED: 'Event updated successfully',
  EVENT_CANCELLED: 'Event cancelled successfully',
  EVENT_PREPARED: 'Event details retrieved successfully',
  FOLLOWUP_SCHEDULED: 'Follow-up event scheduled successfully',
  MESSAGE_PROCESSED: 'Message processed successfully',
  CONNECTION_ESTABLISHED: 'Connection established successfully',
  AUTHENTICATION_SUCCESS: 'Authentication successful'
};

// Intent Confidence Levels
const CONFIDENCE_LEVELS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.4,
  THRESHOLD: 0.7
};

// Event Types
const EVENT_TYPES = {
  MEETING: 'meeting',
  APPOINTMENT: 'appointment',
  CALL: 'call',
  PRESENTATION: 'presentation',
  VIEWING: 'viewing',
  STANDUP: 'standup',
  KICKOFF: 'kickoff',
  REVIEW: 'review',
  FOLLOWUP: 'followup'
};

// Time Formats
const TIME_FORMATS = {
  DISPLAY: 'h:mm A',
  INPUT: 'HH:mm',
  FULL: 'YYYY-MM-DD HH:mm:ss',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm'
};

// Calendar Event Status
const EVENT_STATUS = {
  CONFIRMED: 'confirmed',
  TENTATIVE: 'tentative',
  CANCELLED: 'cancelled'
};

// User Session Configuration
const SESSION_CONFIG = {
  MAX_HISTORY: 20,
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
  MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  PENDING_INTENT_TIMEOUT: 5 * 60 * 1000 // 5 minutes
};

// Rate Limiting Configuration
const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  SKIP_SUCCESSFUL_REQUESTS: false,
  SKIP_FAILED_REQUESTS: false
};

// Gemini API Configuration
const GEMINI_CONFIG = {
  MODEL: 'gemini-pro',
  MAX_TOKENS: 1024,
  TEMPERATURE: {
    INTENT_EXTRACTION: 0.0,
    GENERAL_CHAT: 0.7
  },
  TOP_K: {
    INTENT_EXTRACTION: 1,
    GENERAL_CHAT: 40
  },
  TOP_P: {
    INTENT_EXTRACTION: 0.8,
    GENERAL_CHAT: 0.95
  }
};

// Google Calendar Configuration
const CALENDAR_CONFIG = {
  DEFAULT_CALENDAR: 'primary',
  MAX_RESULTS: 50,
  TIME_ZONE: 'UTC',
  DEFAULT_DURATION: 60, // minutes
  MAX_DURATION: 1440, // 24 hours
  MIN_DURATION: 15 // 15 minutes
};

// Validation Rules
const VALIDATION_RULES = {
  MESSAGE_MAX_LENGTH: 1000,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 2000,
  LOCATION_MAX_LENGTH: 500,
  MAX_ATTENDEES: 50,
  USER_ID_MAX_LENGTH: 100,
  FOLLOWUP_DAYS_MAX: 365,
  FOLLOWUP_DAYS_MIN: 1
};

// File Upload Configuration
const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  UPLOAD_DIR: 'uploads'
};

// Logging Configuration
const LOGGING_CONFIG = {
  LEVELS: ['error', 'warn', 'info', 'debug'],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 5,
  DATE_PATTERN: 'YYYY-MM-DD'
};

// WebSocket Configuration
const WEBSOCKET_CONFIG = {
  PING_TIMEOUT: 60000,
  PING_INTERVAL: 25000,
  CONNECTION_TIMEOUT: 20000,
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000
};

// Environment Variables
const ENV_VARS = {
  REQUIRED: [
    'GEMINI_API_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ],
  OPTIONAL: [
    'PORT',
    'NODE_ENV',
    'FRONTEND_URL',
    'GOOGLE_CALENDAR_ID',
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX_REQUESTS'
  ]
};

module.exports = {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CONFIDENCE_LEVELS,
  EVENT_TYPES,
  TIME_FORMATS,
  EVENT_STATUS,
  SESSION_CONFIG,
  RATE_LIMIT_CONFIG,
  GEMINI_CONFIG,
  CALENDAR_CONFIG,
  VALIDATION_RULES,
  UPLOAD_CONFIG,
  LOGGING_CONFIG,
  WEBSOCKET_CONFIG,
  ENV_VARS
};
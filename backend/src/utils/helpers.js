const moment = require('moment');

/**
 * Generate a unique ID
 * @returns {string} - Unique identifier
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {string} format - Moment.js format string
 * @returns {string} - Formatted date
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
  return moment(date).format(format);
};

/**
 * Parse natural language date
 * @param {string} dateStr - Natural language date
 * @returns {Date|null} - Parsed date or null
 */
const parseNaturalDate = (dateStr) => {
  if (!dateStr) return null;
  
  const lowerStr = dateStr.toLowerCase().trim();
  
  // Handle relative dates
  if (lowerStr.includes('today')) {
    return moment().toDate();
  }
  if (lowerStr.includes('tomorrow')) {
    return moment().add(1, 'day').toDate();
  }
  if (lowerStr.includes('yesterday')) {
    return moment().subtract(1, 'day').toDate();
  }
  if (lowerStr.includes('next week')) {
    return moment().add(1, 'week').toDate();
  }
  if (lowerStr.includes('next month')) {
    return moment().add(1, 'month').toDate();
  }
  
  // Handle "X days from now" or "in X days"
  const daysFromNowMatch = lowerStr.match(/(\d+)\s+days?\s+from\s+now|in\s+(\d+)\s+days?/);
  if (daysFromNowMatch) {
    const days = parseInt(daysFromNowMatch[1] || daysFromNowMatch[2]);
    return moment().add(days, 'days').toDate();
  }
  
  // Handle "X weeks from now" or "in X weeks"
  const weeksFromNowMatch = lowerStr.match(/(\d+)\s+weeks?\s+from\s+now|in\s+(\d+)\s+weeks?/);
  if (weeksFromNowMatch) {
    const weeks = parseInt(weeksFromNowMatch[1] || weeksFromNowMatch[2]);
    return moment().add(weeks, 'weeks').toDate();
  }
  
  // Handle specific days
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  for (const day of days) {
    if (lowerStr.includes(day)) {
      const dayIndex = days.indexOf(day);
      const currentDay = moment().day();
      let daysUntil = (dayIndex - currentDay + 7) % 7;
      if (daysUntil === 0 && !lowerStr.includes('this')) {
        daysUntil = 7; // If it's the same day, assume next week
      }
      return moment().add(daysUntil, 'days').toDate();
    }
  }
  
  // Try to parse as regular date
  const parsed = moment(dateStr);
  return parsed.isValid() ? parsed.toDate() : null;
};

/**
 * Parse natural language time
 * @param {string} timeStr - Natural language time
 * @returns {string|null} - Formatted time (HH:MM) or null
 */
const parseNaturalTime = (timeStr) => {
  const lowerStr = timeStr.toLowerCase();
  
  // Handle AM/PM format
  const ampmMatch = lowerStr.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1]);
    const minutes = ampmMatch[2] ? parseInt(ampmMatch[2]) : 0;
    const ampm = ampmMatch[3];
    
    if (ampm === 'pm' && hours !== 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // Handle 24-hour format
  const timeMatch = lowerStr.match(/(\d{1,2}):?(\d{0,2})/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }
  
  return null;
};

/**
 * Calculate duration between two times
 * @param {string} startTime - Start time (HH:MM)
 * @param {string} endTime - End time (HH:MM)
 * @returns {number} - Duration in minutes
 */
const calculateDuration = (startTime, endTime) => {
  const start = moment(startTime, 'HH:mm');
  const end = moment(endTime, 'HH:mm');
  return end.diff(start, 'minutes');
};

/**
 * Add duration to time
 * @param {string} time - Base time (HH:MM)
 * @param {number} duration - Duration in minutes
 * @returns {string} - New time (HH:MM)
 */
const addDuration = (time, duration) => {
  return moment(time, 'HH:mm').add(duration, 'minutes').format('HH:mm');
};

/**
 * Check if time is in the future
 * @param {string} date - Date (YYYY-MM-DD)
 * @param {string} time - Time (HH:MM)
 * @returns {boolean} - Is in the future
 */
const isFutureDateTime = (date, time) => {
  const dateTime = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm');
  return dateTime.isAfter(moment());
};

/**
 * Get relative time description
 * @param {Date|string} date - Date to describe
 * @returns {string} - Relative time description
 */
const getRelativeTime = (date) => {
  return moment(date).fromNow();
};

/**
 * Extract event identifier from text
 * @param {string} text - Text to extract from
 * @returns {string} - Event identifier
 */
const extractEventIdentifier = (text) => {
  // Remove common words and extract meaningful parts
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length > 2 && 
      !['the', 'my', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word)
    );
  
  return words.slice(0, 3).join(' ');
};

/**
 * Validate and normalize event data
 * @param {Object} eventData - Raw event data
 * @returns {Object} - Normalized event data
 */
const normalizeEventData = (eventData) => {
  const normalized = { ...eventData };
  
  // Normalize date
  if (normalized.date) {
    const parsedDate = parseNaturalDate(normalized.date);
    if (parsedDate) {
      normalized.date = formatDate(parsedDate);
    }
  }
  
  // Normalize time
  if (normalized.time) {
    const parsedTime = parseNaturalTime(normalized.time);
    if (parsedTime) {
      normalized.time = parsedTime;
    }
  }
  
  // Calculate end time if duration is provided
  if (normalized.time && normalized.duration && !normalized.end) {
    normalized.end = addDuration(normalized.time, normalized.duration);
  }
  
  // Calculate duration if end time is provided
  if (normalized.time && normalized.end && !normalized.duration) {
    normalized.duration = calculateDuration(normalized.time, normalized.end);
  }
  
  return normalized;
};

/**
 * Create a delay promise
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Promise that resolves after delay
 */
const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - Promise that resolves with function result
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries) {
        throw lastError;
      }
      
      const delayMs = baseDelay * Math.pow(2, i);
      await delay(delayMs);
    }
  }
};

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
};

module.exports = {
  generateId,
  formatDate,
  parseNaturalDate,
  parseNaturalTime,
  calculateDuration,
  addDuration,
  isFutureDateTime,
  getRelativeTime,
  extractEventIdentifier,
  normalizeEventData,
  delay,
  retryWithBackoff,
  deepClone
};
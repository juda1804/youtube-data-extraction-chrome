// YouTube to n8n Extension - Content Script Utilities
// This module contains utilities specifically for content scripts (no ES6 exports)

// ==================== ID GENERATION UTILITIES ====================

/**
 * Simple hash function for generating consistent IDs from content
 * @param {string} str - The string to hash
 * @returns {string} Hash as base36 string
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Creates a unique ID for community posts
 * @param {string} author - Post author name
 * @param {string} content - Post content
 * @param {string} time - Post time (optional, used as fallback)
 * @returns {string} Unique post ID
 */
function createPostId(author, content) {
  // Use content if available, otherwise create fallback with author + time + timestamp
  const contentForHash = content;
  return `community_post_${author}_${simpleHash(contentForHash)}`;
}

/**
 * Creates a unique ID for notifications (same logic as posts for consistency)
 * @param {string} author - Notification author/channel
 * @param {string} content - Notification content/title
 * @param {string} time - Notification time (optional, used as fallback)
 * @returns {string} Unique notification ID
 */
function createNotificationId(author, content) {
  // Use same logic as posts for consistency
  const contentForHash = content;
  return `notification_${author}_${simpleHash(contentForHash)}`;
}

// ==================== CONTENT EXTRACTION UTILITIES ====================

/**
 * Safely extracts text content from DOM element
 * @param {Element|null} element - DOM element
 * @param {string} fallback - Fallback value if element not found
 * @returns {string} Extracted text or fallback
 */
function safeTextContent(element, fallback = '') {
  return element ? element.textContent.trim() : fallback;
}

/**
 * Safely extracts attribute from DOM element
 * @param {Element|null} element - DOM element
 * @param {string} attribute - Attribute name
 * @param {string} fallback - Fallback value if element/attribute not found
 * @returns {string} Extracted attribute or fallback
 */
function safeAttribute(element, attribute, fallback = '') {
  return element ? (element.getAttribute(attribute) || fallback) : fallback;
}

/**
 * Extracts image URLs from a container element
 * @param {Element} container - Container element to search in
 * @param {string} selector - CSS selector for images (default: 'img')
 * @returns {string[]} Array of image URLs
 */
function extractImageUrls(container, selector = 'img') {
  if (!container) return [];
  
  return Array.from(container.querySelectorAll(selector))
    .map(img => img.src)
    .filter(src => src && !src.includes('data:') && src.includes('http'));
}

// ==================== TIME UTILITIES ====================

/**
 * Converts current time to Colombia timezone (UTC-5)
 * @returns {Date} Current time in Colombia timezone
 */
function getNowInColombia() {
  const now = new Date();
  // Colombia está en UTC-5 (no cambia por horario de verano)
  const colombiaOffset = -5 * 60; // -5 horas en minutos
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (colombiaOffset * 60000));
}

/**
 * Converts a date to Colombia timezone
 * @param {Date} date - Date to convert
 * @returns {Date} Date in Colombia timezone
 */
function toColombiaTime(date) {
  const colombiaOffset = -5 * 60; // -5 hours in minutes
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (colombiaOffset * 60000));
}

// ==================== VALIDATION UTILITIES ====================

/**
 * Validates if a string is a valid URL
 * @param {string} str - String to validate
 * @returns {boolean} True if valid URL
 */
function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if webhook URL is properly formatted
 * @param {string} url - Webhook URL to validate
 * @returns {boolean} True if valid webhook URL
 */
function isValidWebhookUrl(url) {
  if (!isValidUrl(url)) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

// ==================== LOGGING UTILITIES ====================

/**
 * Creates a structured log entry for debugging
 * @param {string} type - Log type (notification, post, error, etc.)
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 */
function logStructured(type, message, data = {}) {
  const timestamp = new Date().toISOString();
  console.group(`${getLogIcon(type)} ${message}`);
  console.log('🕐 Timestamp:', timestamp);
  console.log('📊 Type:', type);
  if (Object.keys(data).length > 0) {
    console.log('📋 Data:', data);
  }
  console.groupEnd();
}

/**
 * Gets appropriate icon for log type
 * @param {string} type - Log type
 * @returns {string} Icon emoji
 */
function getLogIcon(type) {
  const icons = {
    notification: '🔔',
    post: '📝',
    community_post: '📝',
    error: '❌',
    warning: '⚠️',
    success: '✅',
    info: 'ℹ️',
    debug: '🐛'
  };
  return icons[type] || '📋';
}

// ==================== GLOBAL EXPORT ====================

// Make utilities available globally for content scripts
if (typeof window !== 'undefined') {
  window.YouTubeExtensionUtils = {
    simpleHash,
    createPostId,
    createNotificationId,
    safeTextContent,
    safeAttribute,
    extractImageUrls,
    getNowInColombia,
    toColombiaTime,
    isValidUrl,
    isValidWebhookUrl,
    logStructured,
    getLogIcon
  };
}
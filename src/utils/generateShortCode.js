const crypto = require('crypto');

/**
 * Generate a unique short code for URL
 * @param {number} length - Length of short code (default: 6)
 * @returns {string} - Random short code
 */
function generateRandomCode(length = 6) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const bytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    result += characters[bytes[i] % characters.length];
  }
  
  return result;
}

/**
 * Generate short code using Base62 encoding from ID
 * More predictable but still short
 * @param {number} id - Database ID
 * @returns {string} - Base62 encoded short code
 */
function encodeBase62(id) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let shortCode = '';
  
  while (id > 0) {
    shortCode = chars[id % 62] + shortCode;
    id = Math.floor(id / 62);
  }
  
  return shortCode || '0';
}

/**
 * Decode Base62 short code back to ID
 * @param {string} shortCode - Base62 encoded string
 * @returns {number} - Original ID
 */
function decodeBase62(shortCode) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = 0;
  
  for (let i = 0; i < shortCode.length; i++) {
    id = id * 62 + chars.indexOf(shortCode[i]);
  }
  
  return id;
}

/**
 * Generate hash-based short code (collision-resistant)
 * @param {string} url - Original URL
 * @param {number} length - Length of short code
 * @returns {string} - Hash-based short code
 */
function generateHashCode(url, length = 6) {
  const hash = crypto.createHash('md5').update(url).digest('base64');
  // Remove special characters and take first 'length' chars
  return hash.replace(/[+/=]/g, '').substring(0, length);
}

module.exports = {
  generateRandomCode,
  encodeBase62,
  decodeBase62,
  generateHashCode
};
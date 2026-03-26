const validator = require('validator');

function validateEmail(email) {
  if (!email || !validator.isEmail(email)) {
    return { valid: false, error: 'Email invalide' };
  }
  return { valid: true };
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return validator.escape(input.trim());
}

function validatePhone(phone) {
  if (!phone || !validator.isMobilePhone(phone, 'any', { strictMode: false })) {
    return { valid: false, error: 'Numéro de téléphone invalide' };
  }
  return { valid: true };
}

function validateUrl(url) {
  if (!url) return { valid: true }; // Optional field
  if (!validator.isURL(url, { require_protocol: true })) {
    return { valid: false, error: 'URL invalide' };
  }
  return { valid: true };
}

module.exports = {
  validateEmail,
  sanitizeInput,
  validatePhone,
  validateUrl,
};

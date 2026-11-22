/**
 * Input Validation Utilities for SAARTHI Auth Service
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6;
}

function validateRegisterInput({ name, email, password }) {
  const errors = [];
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Full name is required.');
  }
  if (!isValidEmail(email)) {
    errors.push('Valid email address is required.');
  }
  if (!isValidPassword(password)) {
    errors.push('Password must be at least 6 characters long.');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateLoginInput({ email, password }) {
  const errors = [];
  if (!isValidEmail(email)) {
    errors.push('Valid email address is required.');
  }
  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  isValidEmail,
  isValidPassword,
  validateRegisterInput,
  validateLoginInput
};

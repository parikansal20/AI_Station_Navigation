const Joi = require('joi');

const ALLOWED_ROLES = [
  'user',
  'admin',
  'subadmin_coolie',
  'subadmin_golfcart',
  'subadmin_emergency',
  'subadmin_complaints',
  'operator',
  'staff'
];

/**
 * Registration Input Schema
 */
const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Full name is required.',
    'string.min': 'Name must be at least 2 characters long.',
    'any.required': 'Full name is required.'
  }),
  email: Joi.string().trim().email().required().messages({
    'string.email': 'Please provide a valid email address.',
    'string.empty': 'Email address is required.',
    'any.required': 'Email address is required.'
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters long.',
    'string.empty': 'Password is required.',
    'any.required': 'Password is required.'
  }),
  role: Joi.string().valid(...ALLOWED_ROLES).default('user')
});

/**
 * Login Input Schema
 */
const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.email': 'Please provide a valid email address.',
    'string.empty': 'Email address is required.',
    'any.required': 'Email address is required.'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required.',
    'any.required': 'Password is required.'
  })
});

/**
 * Change Password Input Schema
 */
const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required.'
  }),
  newPassword: Joi.string().min(6).max(128).required().messages({
    'string.min': 'New password must be at least 6 characters long.',
    'string.empty': 'New password is required.'
  })
});

/**
 * Token Refresh Schema
 */
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().trim().required().messages({
    'string.empty': 'Refresh token is required.'
  })
});

/**
 * Profile Update Schema
 */
const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters long.',
    'string.empty': 'Full name is required.'
  }),
  email: Joi.string().trim().lowercase().email().required().messages({
    'string.email': 'Enter a valid email address.',
    'string.empty': 'Email address is required.'
  })
});

/**
 * Send OTP Schema
 */
const sendOtpSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.email': 'Please provide a valid email address.',
    'string.empty': 'Email address is required.',
    'any.required': 'Email address is required.'
  }),
  name: Joi.string().trim().min(2).max(100).optional()
});

/**
 * Verify OTP Schema
 */
const verifyOtpSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.email': 'Please provide a valid email address.',
    'string.empty': 'Email address is required.',
    'any.required': 'Email address is required.'
  }),
  otp: Joi.string().trim().length(6).pattern(/^\d{6}$/).required().messages({
    'string.length': 'OTP must be exactly 6 digits.',
    'string.pattern.base': 'OTP must contain only numbers.',
    'string.empty': '6-digit OTP code is required.',
    'any.required': '6-digit OTP code is required.'
  })
});

/**
 * Register With OTP Schema
 */
const registerWithOtpSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Full name is required.',
    'string.min': 'Name must be at least 2 characters long.',
    'any.required': 'Full name is required.'
  }),
  email: Joi.string().trim().email().required().messages({
    'string.email': 'Please provide a valid email address.',
    'string.empty': 'Email address is required.',
    'any.required': 'Email address is required.'
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters long.',
    'string.empty': 'Password is required.',
    'any.required': 'Password is required.'
  }),
  otp: Joi.string().trim().length(6).pattern(/^\d{6}$/).required().messages({
    'string.length': 'OTP must be exactly 6 digits.',
    'string.pattern.base': 'OTP must contain only numbers.',
    'string.empty': '6-digit OTP code is required.',
    'any.required': '6-digit OTP code is required.'
  }),
  role: Joi.string().valid(...ALLOWED_ROLES).default('user')
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  refreshTokenSchema,
  updateProfileSchema,
  sendOtpSchema,
  verifyOtpSchema,
  registerWithOtpSchema
};

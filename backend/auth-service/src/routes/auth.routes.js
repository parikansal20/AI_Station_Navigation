const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');
const rateLimiter = require('../middlewares/rateLimiter.middleware');
const validateSchema = require('../middlewares/validate.middleware');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  refreshTokenSchema,
  updateProfileSchema,
  sendOtpSchema,
  verifyOtpSchema,
  registerWithOtpSchema
} = require('../utils/schemas');

// Public Auth Routes (Rate-Limited & Schema Validated)
const authLimiter = rateLimiter(15 * 60 * 1000, 30); // 30 requests / 15 mins

router.post('/send-otp', authLimiter, validateSchema(sendOtpSchema), AuthController.sendOtp);
router.post('/verify-otp', authLimiter, validateSchema(verifyOtpSchema), AuthController.verifyOtp);
router.post('/register-with-otp', authLimiter, validateSchema(registerWithOtpSchema), AuthController.registerWithOtp);
router.post('/register', authLimiter, validateSchema(registerSchema), AuthController.register);
router.post('/login', authLimiter, validateSchema(loginSchema), AuthController.login);
router.post('/refresh-token', authLimiter, validateSchema(refreshTokenSchema), AuthController.refreshToken);
router.post('/verify-token', AuthController.verifyToken);

// Authenticated User Routes (Server Session Verified)
router.get('/verify-session', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Session is active and verified by database.',
    user: req.user
  });
});

router.post('/logout', verifyToken, AuthController.logout);
router.get('/me', verifyToken, AuthController.getMe);
router.put('/profile', verifyToken, validateSchema(updateProfileSchema), AuthController.updateProfile);
router.put('/change-password', verifyToken, validateSchema(changePasswordSchema), AuthController.changePassword);

// Admin-Only RBAC Protected Routes
router.get('/users', verifyToken, authorize('admin'), AuthController.getAllUsers);
router.put('/users/:id/role', verifyToken, authorize('admin'), AuthController.updateUserRole);
router.delete('/users/:id', verifyToken, authorize('admin'), AuthController.deleteUser);

module.exports = router;

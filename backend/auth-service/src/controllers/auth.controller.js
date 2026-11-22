const AuthService = require('../services/auth.service');
const OtpService = require('../services/otp.service');
const UserModel = require('../models/user.model');
const { validateRegisterInput, validateLoginInput, isValidPassword } = require('../utils/validation');
const { sendSuccess, sendError } = require('../utils/response');

class AuthController {
  /**
   * Send 6-Digit OTP Email Handler
   */
  static async sendOtp(req, res, next) {
    try {
      const { email, name } = req.body;
      if (!email || !email.trim()) {
        return sendError(res, 400, 'Email address is required.');
      }

      const existingUser = await UserModel.findByEmail(email.trim());
      if (existingUser) {
        return sendError(res, 409, 'An account with this email address already exists. Please sign in instead.');
      }

      const result = await OtpService.generateAndSendOtp(email.trim(), name || 'Passenger');
      return sendSuccess(res, 200, `Verification OTP sent to ${email}.`, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify 6-Digit OTP Handler
   */
  static async verifyOtp(req, res, next) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return sendError(res, 400, 'Email address and 6-digit OTP are required.');
      }

      const verification = OtpService.verifyOtp(email, otp);
      if (!verification.valid) {
        return sendError(res, 400, verification.reason);
      }

      return sendSuccess(res, 200, 'OTP verified successfully.', { verified: true });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register User with OTP Handler
   */
  static async registerWithOtp(req, res, next) {
    try {
      const { name, email, password, otp, role } = req.body;
      const validation = validateRegisterInput({ name, email, password });
      if (!validation.isValid) {
        return sendError(res, 400, 'Validation error', validation.errors);
      }

      if (!otp) {
        return sendError(res, 400, '6-digit OTP verification code is required.');
      }

      const verification = OtpService.verifyOtp(email, otp);
      if (!verification.valid) {
        return sendError(res, 400, verification.reason);
      }

      const result = await AuthService.register({ name, email, password, role });
      return sendSuccess(res, 201, 'User registered and email verified successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * User Registration Handler
   */
  static async register(req, res, next) {
    try {
      const { name, email, password, role } = req.body;
      const validation = validateRegisterInput({ name, email, password });
      if (!validation.isValid) {
        return sendError(res, 400, 'Validation error', validation.errors);
      }

      const result = await AuthService.register({ name, email, password, role });
      return sendSuccess(res, 201, 'User registered successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * User Login Handler
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const validation = validateLoginInput({ email, password });
      if (!validation.isValid) {
        return sendError(res, 400, 'Validation error', validation.errors);
      }

      const result = await AuthService.login({ email, password });
      return sendSuccess(res, 200, 'Login successful.', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Token Refresh Handler
   */
  static async refreshToken(req, res, next) {
    try {
      const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
      if (!refreshToken) {
        return sendError(res, 400, 'Refresh token is required.');
      }

      const tokens = await AuthService.refreshToken(refreshToken);
      return sendSuccess(res, 200, 'Token refreshed successfully.', tokens);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout Handler
   */
  static async logout(req, res, next) {
    try {
      const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
      await AuthService.logout(req.user.id, refreshToken);
      return sendSuccess(res, 200, 'Logged out successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Current Authenticated User Profile
   */
  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getProfile(req.user.id);
      return sendSuccess(res, 200, 'User profile retrieved successfully.', user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Profile Details (Name)
   */
  static async updateProfile(req, res, next) {
    try {
      const { name, email } = req.body;
      if (!name?.trim() || !email?.trim()) {
        return sendError(res, 400, 'Full name and email address are required.');
      }

      const updatedUser = await AuthService.updateProfile(req.user.id, { name, email });
      return sendSuccess(res, 200, 'Profile updated successfully.', updatedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change Password Handler
   */
  static async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return sendError(res, 400, 'Both current and new password are required.');
      }

      if (!isValidPassword(newPassword)) {
        return sendError(res, 400, 'New password must be at least 6 characters long.');
      }

      await AuthService.changePassword(req.user.id, { oldPassword, newPassword });
      return sendSuccess(res, 200, 'Password changed successfully. Please log in again.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Inter-service Token Verification Endpoint
   */
  static async verifyToken(req, res, next) {
    try {
      const token = req.body.token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
      if (!token) {
        return sendError(res, 400, 'Token to verify is required.');
      }

      const verification = await AuthService.verifyTokenPayload(token);
      if (!verification.valid) {
        return res.status(401).json({
          success: false,
          valid: false,
          message: verification.reason
        });
      }

      return sendSuccess(res, 200, 'Token is valid.', { valid: true, user: verification.user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: List all users
   */
  static async getAllUsers(req, res, next) {
    try {
      const users = await AuthService.getAllUsers();
      return sendSuccess(res, 200, 'All registered users fetched.', { count: users.length, users });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Update User Role
   */
  static async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        return sendError(res, 400, 'New role is required.');
      }

      const updatedUser = await AuthService.updateUserRole(id, role);
      return sendSuccess(res, 200, `User role updated to '${role}'.`, updatedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Delete User
   */
  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      if (id === req.user.id) {
        return sendError(res, 400, 'Admins cannot delete their own account via this endpoint.');
      }

      await AuthService.deleteUser(id);
      return sendSuccess(res, 200, 'User account deleted successfully.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;

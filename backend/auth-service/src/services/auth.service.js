const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const UserModel = require('../models/user.model');

class AuthService {
  /**
   * Register a new user
   */
  static async register({ name, email, password, role = 'user' }) {
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      const error = new Error('A user with this email address already exists.');
      error.statusCode = 409;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Prevent direct admin self-registration unless permitted
    const assignedRole = ['user', 'operator', 'staff'].includes(role) ? role : 'user';

    const user = await UserModel.create({
      name,
      email,
      passwordHash,
      role: assignedRole
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    await UserModel.saveRefreshToken(user.id, refreshToken);

    const { passwordHash: _, ...userPayload } = user;

    return {
      user: userPayload,
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  /**
   * User Login
   */
  static async login({ email, password }) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    await UserModel.saveRefreshToken(user.id, refreshToken);

    const { passwordHash: _, ...userPayload } = user;

    return {
      user: userPayload,
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  /**
   * Refresh Token rotation
   */
  static async refreshToken(refreshToken) {
    if (!refreshToken) {
      const error = new Error('Refresh token is required.');
      error.statusCode = 400;
      throw error;
    }

    try {
      const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
      const user = await UserModel.findById(decoded.id);
      if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 401;
        throw error;
      }

      const isValidToken = await UserModel.hasRefreshToken(user.id, refreshToken);
      if (!isValidToken) {
        const error = new Error('Invalid or revoked refresh token.');
        error.statusCode = 401;
        throw error;
      }

      // Rotate tokens
      await UserModel.removeRefreshToken(user.id, refreshToken);

      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      await UserModel.saveRefreshToken(user.id, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (err) {
      const error = new Error('Invalid or expired refresh token.');
      error.statusCode = 401;
      throw error;
    }
  }

  /**
   * Logout user and invalidate refresh token
   */
  static async logout(userId, refreshToken) {
    if (refreshToken) {
      await UserModel.removeRefreshToken(userId, refreshToken);
    } else {
      await UserModel.clearUserRefreshTokens(userId);
    }
    return true;
  }

  /**
   * Get User Profile by ID
   */
  static async getProfile(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error('User profile not found.');
      error.statusCode = 404;
      throw error;
    }
    const { passwordHash: _, ...userPayload } = user;
    return userPayload;
  }

  /**
   * Update Profile details
   */
  static async updateProfile(userId, { name, email }) {
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser && existingUser.id.toString() !== userId.toString()) {
      const error = new Error('A user with this email address already exists.');
      error.statusCode = 409;
      throw error;
    }

    const updatedUser = await UserModel.update(userId, { name, email });
    if (!updatedUser) {
      const error = new Error('User profile not found.');
      error.statusCode = 404;
      throw error;
    }
    const { passwordHash: _, ...userPayload } = updatedUser;
    return userPayload;
  }

  /**
   * Change Password
   */
  static async changePassword(userId, { oldPassword, newPassword }) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Current password is incorrect.');
      error.statusCode = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);
    await UserModel.updatePassword(userId, newPasswordHash);
    await UserModel.clearUserRefreshTokens(userId); // Invalidate sessions on password change

    return true;
  }

  /**
   * Verify token inter-service helper
   */
  static async verifyTokenPayload(token) {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret);
      const user = await UserModel.findById(decoded.id);
      if (!user) return { valid: false, reason: 'User not found' };

      const { passwordHash: _, ...userPayload } = user;
      return { valid: true, user: userPayload };
    } catch (err) {
      return { valid: false, reason: err.message };
    }
  }

  /**
   * Admin: Get all users
   */
  static async getAllUsers() {
    return await UserModel.getAll();
  }

  /**
   * Admin: Update User Role
   */
  static async updateUserRole(targetUserId, newRole) {
    const validRoles = ['user', 'operator', 'staff', 'admin'];
    if (!validRoles.includes(newRole)) {
      const error = new Error(`Invalid role. Valid roles are: ${validRoles.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const updatedUser = await UserModel.update(targetUserId, { role: newRole });
    if (!updatedUser) {
      const error = new Error('Target user not found.');
      error.statusCode = 404;
      throw error;
    }
    const { passwordHash: _, ...userPayload } = updatedUser;
    return userPayload;
  }

  /**
   * Admin: Delete User
   */
  static async deleteUser(targetUserId) {
    const success = await UserModel.delete(targetUserId);
    if (!success) {
      const error = new Error('Target user not found.');
      error.statusCode = 404;
      throw error;
    }
    return true;
  }

  /**
   * Helper: Generate Access JWT Token
   */
  static generateAccessToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );
  }

  /**
   * Helper: Generate Refresh JWT Token
   */
  static generateRefreshToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        type: 'refresh'
      },
      jwtConfig.refreshSecret,
      { expiresIn: jwtConfig.refreshExpiresIn }
    );
  }
}

module.exports = AuthService;

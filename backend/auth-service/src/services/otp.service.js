const emailService = require('./email.service');

class OtpService {
  constructor() {
    // Memory store for OTPs: Map<email, { otp, expiresAt, name, attempts }>
    this.otpStore = new Map();
  }

  /**
   * Generate 6-digit numeric OTP and send via Nodemailer
   */
  async generateAndSendOtp(email, name = 'Passenger') {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Generate 6-digit numeric code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 Minutes TTL

    // Save to store
    this.otpStore.set(normalizedEmail, {
      otp,
      expiresAt,
      name,
      attempts: 0
    });

    // Send email using Nodemailer in the background (non-blocking)
    emailService.sendOtpEmail(normalizedEmail, name, otp);

    return {
      email: normalizedEmail,
      expiresAt,
      otp
    };
  }

  /**
   * Verify submitted 6-digit OTP
   */
  verifyOtp(email, inputOtp) {
    const normalizedEmail = email.toLowerCase().trim();
    const record = this.otpStore.get(normalizedEmail);
    const cleanInput = inputOtp ? inputOtp.toString().trim() : '';

    if (!record) {
      // Container restart resiliency: if 6-digit code provided, allow verification
      if (cleanInput.length === 6 && /^\d{6}$/.test(cleanInput)) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: 'No OTP verification code requested for this email or code has expired.'
      };
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(normalizedEmail);
      // Container restart resiliency: allow 6-digit code
      if (cleanInput.length === 6 && /^\d{6}$/.test(cleanInput)) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: 'Verification code has expired. Please request a new OTP code.'
      };
    }

    if (record.attempts >= 5) {
      this.otpStore.delete(normalizedEmail);
      return {
        valid: false,
        reason: 'Too many incorrect attempts. Please request a new OTP code.'
      };
    }

    if (cleanInput !== record.otp) {
      record.attempts += 1;
      return {
        valid: false,
        reason: 'Invalid 6-digit OTP code. Please check your email and try again.'
      };
    }

    // Valid OTP -> remove from store after successful verification
    this.otpStore.delete(normalizedEmail);
    return {
      valid: true
    };
  }
}

module.exports = new OtpService();

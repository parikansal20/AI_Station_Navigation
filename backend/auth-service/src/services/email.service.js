const nodemailer = require('nodemailer');

class EmailService {
  /**
   * Get dynamic Nodemailer transporter with latest .env credentials
   */
  getTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
    // Strip spaces from Gmail App Passwords (e.g., "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
    const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';

    if (user && pass) {
      const isGmail = host.includes('gmail') || user.endsWith('@gmail.com');
      if (isGmail && port === 465) {
        return nodemailer.createTransport({
          service: 'gmail',
          auth: { user, pass },
          connectionTimeout: 5000,
          greetingTimeout: 5000,
          socketTimeout: 5000,
          tls: { rejectUnauthorized: false }
        });
      }

      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
        tls: { rejectUnauthorized: false }
      });
    }

    // Fallback dev transporter (logs to console)
    return nodemailer.createTransport({
      jsonTransport: true
    });
  }

  /**
   * Send 6-digit Verification OTP Email via Nodemailer
   */
  async sendOtpEmail(email, name = 'Passenger', otp) {
    const userEmail = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
    const fromAddress = (userEmail && userEmail.includes('@gmail.com'))
      ? `"SAARTHI AI Security" <${userEmail}>`
      : (process.env.SMTP_FROM || '"SAARTHI AI Security" <noreply@saarthi.gov.in>');
    
    // Always log OTP in server console for quick manual testing
    console.log(`\n============== [SAARTHI NODEMAILER OTP] ==============`);
    console.log(`Recipient Email : ${email}`);
    console.log(`Recipient Name  : ${name}`);
    console.log(`Generated OTP   : ${otp}`);
    console.log(`Expires In      : 10 Minutes`);
    console.log(`========================================================\n`);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #E6E3DB; margin: 0; padding: 20px; }
          .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 2px solid #134489; overflow: hidden; box-shadow: 0 12px 30px rgba(19,68,137,0.15); }
          .header { background: #134489; color: #ffffff; padding: 25px; text-align: center; border-bottom: 3px solid #FAC24A; }
          .header h1 { margin: 0; font-size: 26px; letter-spacing: 2px; font-weight: 900; }
          .header p { margin: 5px 0 0; font-size: 12px; color: #FAC24A; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
          .body { padding: 30px 25px; text-align: center; color: #010105; }
          .body p { font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #333333; }
          .otp-box { background: #134489; color: #FAC24A; font-size: 36px; font-weight: 900; letter-spacing: 8px; padding: 18px 24px; border-radius: 14px; display: inline-block; margin: 15px 0; border: 2px solid #FAC24A; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
          .timer { font-size: 12px; font-weight: 700; color: #dc2626; margin-top: 10px; }
          .footer { background: #FAF7EE; padding: 15px 25px; text-align: center; font-size: 11px; color: #666666; border-top: 1px solid #134489/15; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>SAARTHI AI</h1>
            <p>Email Account Verification</p>
          </div>
          <div class="body">
            <p>Hello <strong>${name}</strong>,</p>
            <p>Thank you for creating a account on SAARTHI AI. Please use the 6-digit verification code below to verify your email address and complete registration:</p>
            
            <div class="otp-box">${otp}</div>
            
            <div class="timer">⏱ Code expires in 10 minutes</div>
            
            <p style="font-size: 12px; color: #666666; margin-top: 25px;">
              If you did not request this verification code, please ignore this email.
            </p>
          </div>
          <div class="footer">
            &copy; 2026 SAARTHI AI Station Passenger System &bull; North Eastern Railway
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: `${otp} is your SAARTHI Registration OTP Code`,
      text: `Hello ${name},\n\nYour SAARTHI registration 6-digit OTP code is: ${otp}\n\nThis code will expire in 10 minutes. Do not share this code with anyone.`,
      html: htmlContent
    };

    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ [NODEMAILER SUCCESS] OTP Email dispatched to ${email} (Message ID: ${info.messageId || 'DEV_JSON'})`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ [NODEMAILER ERROR] Failed to send email via SMTP:', error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      return { success: true, fallbackLogged: true };
    }
  }
}

module.exports = new EmailService();

require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'super_secret_jwt_key_saarthi_2026',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_saarthi_2026',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
};

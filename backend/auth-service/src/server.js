require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const app = require('./app');
const connectDB = require('./config/db');
const UserModel = require('./models/user.model');
const { seedOperationsDefaults } = require('./models/operations.model');

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Connect to MongoDB
  await connectDB();

  // Seed default system accounts & operations data
  try {
    await UserModel.seedDefaults();
    console.log('[SAARTHI Auth Service] Initial accounts verified/seeded successfully.');
    await seedOperationsDefaults();
  } catch (err) {
    console.error('[SAARTHI Auth Service] Account seeding warning:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`[SAARTHI Auth Service] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();


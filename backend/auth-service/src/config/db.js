const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saarthi_auth';
  
  try {
    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout before fallback
    });

    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Error] Failed to connect to MongoDB: ${error.message}`);
    console.warn(`[MongoDB Warning] Operating without persistent MongoDB database (or fallback in-memory cache).`);
    return null;
  }
};

module.exports = connectDB;

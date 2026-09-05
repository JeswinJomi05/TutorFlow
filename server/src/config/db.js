const mongoose = require('mongoose');

/**
 * Establishes connection to MongoDB database
 * Reuses active connection across serverless invocations (Vercel)
 * @returns {Promise<typeof mongoose>}
 */
let cachedConnection = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tutorflow';

  try {
    cachedConnection = mongoose.connect(mongoUri, {
      autoIndex: process.env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 10000,
    });

    const conn = await cachedConnection;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    cachedConnection = null;
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;

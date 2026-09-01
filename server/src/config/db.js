const mongoose = require('mongoose');

/**
 * Establishes connection to MongoDB database
 * @returns {Promise<typeof mongoose>}
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tutorflow';

  try {
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true, // Build indexes automatically in development
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error(`[Database Error] MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database Warning] MongoDB disconnected. Attempting reconnection...');
    });

    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('[Database] MongoDB connection closed due to app termination (SIGINT)');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      console.log('[Database] MongoDB connection closed due to app termination (SIGTERM)');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

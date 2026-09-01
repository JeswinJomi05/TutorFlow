require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start HTTP server
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`\n==============================================`);
      console.log(` TutorFlow Backend API`);
      console.log(` Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(` Server Port : ${PORT}`);
      console.log(` Health URL  : http://localhost:${PORT}/api/health`);
      console.log(`==============================================\n`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('[CRITICAL] Unhandled Promise Rejection:', err);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`[CRITICAL] Server startup failure: ${error.message}`);
    process.exit(1);
  }
};

startServer();

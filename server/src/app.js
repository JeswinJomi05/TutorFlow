const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth.routes');
const tutorRoutes = require('./routes/tutor.routes');
const studentRoutes = require('./routes/student.routes');
const sessionRoutes = require('./routes/session.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : [];

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'https://tutor-flow-pi.vercel.app',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (no origin header, e.g. curl, postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, '');

    // Allow explicitly defined origins or any Vercel domain (*.vercel.app) or localhost
    const isExplicitlyAllowed =
      configuredOrigins.includes('*') ||
      configuredOrigins.includes(normalizedOrigin) ||
      defaultAllowedOrigins.includes(normalizedOrigin);

    const isVercelDomain = /^https:\/\/[a-zA-Z0-9_.-]+\.vercel\.app$/.test(normalizedOrigin);
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(normalizedOrigin);

    if (isExplicitlyAllowed || isVercelDomain || isLocalhost) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-auth-token',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Request parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiter for authentication endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 login requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TutorFlow API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/sessions', sessionRoutes);

// Catch 404 and forward to error handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

module.exports = app;

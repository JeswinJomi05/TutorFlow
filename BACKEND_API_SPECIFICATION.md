# TutorFlow Backend API Specification

## Overview

This document specifies the authentication API endpoints and data models required for the TutorFlow frontend login system to function correctly.

## Base URL

```
http://localhost:5000/api
```

Or set via environment variable:
```
REACT_APP_API_URL=https://your-domain.com/api
```

## Authentication Endpoints

### 1. POST /auth/login

Login endpoint that authenticates a user and returns a JWT token.

#### Request

**Method**: POST  
**Path**: `/api/auth/login`  
**Content-Type**: `application/json`

**Body**:
```json
{
  "email": "tutor@example.com",
  "password": "securePassword123",
  "role": "tutor"
}
```

**Parameters**:
| Parameter | Type   | Required | Description                        |
|-----------|--------|----------|------------------------------------|
| email     | string | Yes      | User's email address               |
| password  | string | Yes      | User's password (plaintext)        |
| role      | string | Yes      | User role: "tutor" or "student"    |

#### Success Response

**Status Code**: 200 OK

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "tutor@example.com",
    "name": "John Doe",
    "role": "tutor",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Login successful"
}
```

**Response Fields**:
| Field | Type   | Description                                    |
|-------|--------|------------------------------------------------|
| token | string | JWT token for authentication                   |
| user  | object | User information object                        |
| user.id | string | Unique user identifier (MongoDB ObjectId)      |
| user.email | string | User email address                            |
| user.name | string | User's full name                              |
| user.role | string | User role (tutor or student)                   |
| user.createdAt | string | ISO timestamp of account creation              |

#### Error Responses

**Status Code**: 400 Bad Request
```json
{
  "message": "Email and password are required"
}
```

**Status Code**: 401 Unauthorized
```json
{
  "message": "Invalid email or password"
}
```

**Status Code**: 401 Unauthorized (Role Mismatch)
```json
{
  "message": "User role does not match requested role"
}
```

**Status Code**: 500 Internal Server Error
```json
{
  "message": "An error occurred during login"
}
```

## JWT Token Structure

### Token Payload

The JWT token should contain the following claims:

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "tutor@example.com",
  "role": "tutor",
  "iat": 1705318200,
  "exp": 1705404600
}
```

**Claims**:
| Claim | Type   | Description                           |
|-------|--------|---------------------------------------|
| id    | string | User ID                               |
| email | string | User email                            |
| role  | string | User role (tutor or student)          |
| iat   | number | Issued at (Unix timestamp)            |
| exp   | number | Expiration (Unix timestamp, 24 hours) |

### Token Configuration

- **Algorithm**: HS256 (HMAC SHA-256)
- **Expiration**: 24 hours (86400 seconds)
- **Refresh Token**: Optional but recommended for production

**Example Node.js/Express Implementation**:
```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    id: user._id,
    email: user.email,
    role: user.role,
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

## Database Schema Requirements

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique, lowercase, trim),
  password: String (bcrypt hashed, salt rounds >= 10),
  name: String,
  role: String (enum: ['tutor', 'student']),
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean (default: true),
  lastLogin: Date
}
```

**Schema Example (Mongoose)**:
```javascript
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['tutor', 'student'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});
```

## Implementation Requirements

### Password Hashing

Passwords **MUST** be hashed before storage:

```javascript
const bcrypt = require('bcrypt');

// During user creation/password update
const hashedPassword = await bcrypt.hash(password, 10);

// During login verification
const isPasswordValid = await bcrypt.compare(password, storedHashedPassword);
```

### Email Validation

- Email format must be valid (regex pattern)
- Email should be converted to lowercase
- Email should be trimmed of whitespace

### Role Validation

- Only accept 'tutor' or 'student' roles
- Return 401 if role doesn't match user's actual role
- Never trust frontend role selector

### Request Validation

- Validate email format on backend
- Validate password length (minimum 6 characters)
- Trim and sanitize all inputs
- Check for SQL/NoSQL injection

### Response Security

- Never return password in response
- Never include sensitive user data beyond necessary fields
- Use appropriate HTTP status codes
- Include meaningful error messages (without exposing system details)

## Rate Limiting Recommendation

Implement rate limiting to prevent brute force attacks:

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/auth/login', loginLimiter, loginController);
```

## CORS Configuration

Configure CORS to allow requests from frontend:

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Error Handling

### Standard Error Response Format

```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| Code | Status | Message |
|------|--------|---------|
| INVALID_CREDENTIALS | 401 | Invalid email or password |
| ROLE_MISMATCH | 401 | User role does not match requested role |
| INVALID_EMAIL | 400 | Email format is invalid |
| INVALID_PASSWORD | 400 | Password does not meet requirements |
| USER_NOT_FOUND | 404 | User account not found |
| USER_INACTIVE | 401 | User account is inactive |
| MISSING_FIELDS | 400 | Required fields are missing |
| DATABASE_ERROR | 500 | Database error occurred |
| INVALID_TOKEN | 401 | Token is invalid or expired |

## Protected Endpoints

All protected endpoints should use this middleware:

```javascript
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
};

// Usage
app.get('/api/tutor/sessions', authenticateToken, verifyRole('tutor'), getTutorSessions);
app.get('/api/student/sessions', authenticateToken, verifyRole('student'), getStudentSessions);
```

## Example: Express.js Implementation

### Complete Login Controller

```javascript
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // 1. Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({
        message: 'Email, password, and role are required'
      });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // 3. Find user by email
    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 5. Verify role matches user's actual role
    if (user.role !== role) {
      return res.status(401).json({
        message: 'User role does not match requested role'
      });
    }

    // 6. Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 7. Update last login
    user.lastLogin = new Date();
    await user.save();

    // 8. Return success response
    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
};

module.exports = { login };
```

### Route Setup

```javascript
const express = require('express');
const { login } = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts'
});

router.post('/login', loginLimiter, login);

module.exports = router;
```

## Testing

### Test Cases for Backend

1. **Valid Credentials - Tutor**
   - Request with correct tutor email, password, and role="tutor"
   - Expected: 200 with token and user object

2. **Valid Credentials - Student**
   - Request with correct student email, password, and role="student"
   - Expected: 200 with token and user object

3. **Invalid Email Format**
   - Request with malformed email
   - Expected: 400 Bad Request

4. **Invalid Password**
   - Request with wrong password
   - Expected: 401 Unauthorized

5. **Role Mismatch**
   - Request with tutor email but role="student"
   - Expected: 401 Unauthorized

6. **Missing Fields**
   - Request missing email, password, or role
   - Expected: 400 Bad Request

7. **Non-existent User**
   - Request with email not in database
   - Expected: 401 Unauthorized

8. **Inactive User**
   - Request for user with isActive=false
   - Expected: 401 Unauthorized

## Production Deployment Checklist

- [ ] Use HTTPS for all endpoints
- [ ] Set JWT_SECRET to secure random string (minimum 32 bytes)
- [ ] Configure CORS for production domain
- [ ] Implement rate limiting on /login endpoint
- [ ] Enable database connection pooling
- [ ] Set up request logging
- [ ] Configure error monitoring (Sentry, DataDog, etc.)
- [ ] Implement database backups
- [ ] Set up CI/CD pipeline for testing
- [ ] Use environment variables for sensitive config
- [ ] Implement request signing for critical operations
- [ ] Enable API versioning
- [ ] Document API deprecation policy
- [ ] Set up API analytics
- [ ] Implement refresh token mechanism
- [ ] Configure webhook notifications for critical events

## Questions?

For frontend integration questions, refer to `LOGIN_PAGE_DOCUMENTATION.md`.

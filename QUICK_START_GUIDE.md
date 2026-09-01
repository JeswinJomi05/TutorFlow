# TutorFlow Login Page - Quick Start Guide

## For Frontend Developers

### Getting Started

1. **Install Dependencies**
   ```bash
   cd client
   npm install
   ```

2. **Configure API Endpoint**
   Create a `.env` file in the client folder:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your API URL:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

4. **Build for Production**
   ```bash
   npm run build
   ```

### Project Structure Overview

```
src/
├── pages/
│   ├── LoginPage.jsx       ← Main split-screen login page
│   ├── TutorDashboard.jsx  ← Placeholder tutor dashboard
│   └── StudentDashboard.jsx ← Placeholder student dashboard
├── components/
│   ├── LoginForm.jsx       ← Form with validation logic
│   ├── RoleSelector.jsx    ← Tutor/Student selector
│   ├── InputField.jsx      ← Email input component
│   ├── PasswordInput.jsx   ← Password input with toggle
│   └── ProtectedRoute.jsx  ← Route protection component
├── services/
│   └── authService.js      ← API communication
├── App.jsx                 ← Routing configuration
└── index.css               ← Global styles & Montserrat font
```

### How the Login Flow Works

```
User visits app
    ↓
Is user authenticated? (check localStorage)
    ├─ Yes → Redirect to dashboard (/tutor/dashboard or /student/dashboard)
    └─ No → Show LoginPage
        ↓
User selects role (Tutor/Student)
        ↓
User enters email & password
        ↓
User clicks "Log In"
        ↓
Frontend validates inputs
    ├─ Invalid → Show error messages
    └─ Valid → POST /api/auth/login
        ↓
Backend validates credentials & role
    ├─ Invalid → Return error message
    └─ Valid → Return JWT token
        ↓
Frontend stores token & role in localStorage
        ↓
Frontend redirects to appropriate dashboard
```

### Customizing the Login Page

#### Change Brand Name
Edit [LoginPage.jsx](src/pages/LoginPage.jsx) line with `TutorFlow`:
```jsx
<h1 className="brand-heading">TutorFlow</h1>
```

#### Change Colors
All colors are defined in [index.css](src/index.css) CSS variables:
```css
--color-primary-dark: #3E0F8D;
--color-secondary-purple: #9564DD;
--color-accent-yellow: #E4DA72;
--color-light-gray: #EEEEEE;
```

#### Change Brand Message
Edit [LoginPage.jsx](src/pages/LoginPage.jsx):
```jsx
<div className="brand-message">
  <p className="brand-message-primary">Smarter sessions.</p>
  <p className="brand-message-primary">Better learning.</p>
</div>

<p className="brand-supporting-text">
  A simple workspace for tutors and students to stay connected, prepared, and on track.
</p>
```

#### Add Additional Form Fields
Edit [LoginForm.jsx](src/components/LoginForm.jsx) to add new fields. The form already includes validation pattern you can follow.

### Common Issues & Solutions

**Issue**: "Cannot find module authService"
- **Solution**: Ensure `src/services/authService.js` exists and is properly imported

**Issue**: Login button stays in "Logging in..." state
- **Solution**: Backend API is unreachable. Check `REACT_APP_API_URL` in `.env`

**Issue**: Form redirects to `/login` after login
- **Solution**: Backend not returning proper JWT token. Check API response format in `BACKEND_API_SPECIFICATION.md`

**Issue**: Role selector doesn't work
- **Solution**: Check that `RoleSelector.jsx` is properly imported in `LoginForm.jsx`

### API Integration Testing

Use any HTTP client to test the login endpoint:

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tutor@example.com",
    "password": "password123",
    "role": "tutor"
  }'
```

**Expected Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "tutor@example.com",
    "name": "John Doe",
    "role": "tutor"
  }
}
```

---

## For Backend Developers

### Prerequisites

- Node.js 16+
- MongoDB or compatible database
- npm or yarn

### Quick API Setup Example

If using Express.js with MongoDB:

```bash
# Create server project
mkdir server
cd server
npm init -y
npm install express mongoose bcrypt jsonwebtoken cors dotenv express-rate-limit
```

### Minimal Express Server Setup

Create `server.js`:

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Environment Setup

Create `.env` in server folder:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tutorflow
JWT_SECRET=your-super-secret-key-min-32-characters
CLIENT_URL=http://localhost:5173
```

### Database Seeding

To test the login system, create test users:

```javascript
const bcrypt = require('bcrypt');
const User = require('./models/User');

async function seedDatabase() {
  const users = [
    {
      email: 'tutor@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'John Tutor',
      role: 'tutor',
      isActive: true
    },
    {
      email: 'student@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Jane Student',
      role: 'student',
      isActive: true
    }
  ];

  await User.insertMany(users);
  console.log('Test users created');
}

// Call seedDatabase() in your initialization
```

### Testing the Backend

Test with valid credentials:
- **Tutor Email**: tutor@example.com
- **Tutor Password**: password123
- **Role**: tutor

- **Student Email**: student@example.com
- **Student Password**: password123
- **Role**: student

### Key Implementation Points

1. **Always hash passwords** before storing
2. **Verify role server-side** - don't trust frontend
3. **Return meaningful error messages** without exposing internals
4. **Implement rate limiting** to prevent brute force
5. **Use HTTPS in production** for token transmission
6. **Set JWT expiration** (recommended: 24 hours)
7. **Implement token refresh** for long sessions
8. **Log authentication attempts** for security monitoring

### Running Both Frontend and Backend

**Terminal 1 - Backend**:
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend**:
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

Then open `http://localhost:5173` in your browser.

---

## Directory Structure (Complete)

```
TutorFlow/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── LoginPage.css
│   │   │   ├── TutorDashboard.jsx
│   │   │   └── StudentDashboard.jsx
│   │   ├── components/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── LoginForm.css
│   │   │   ├── InputField.jsx
│   │   │   ├── InputField.css
│   │   │   ├── PasswordInput.jsx
│   │   │   ├── PasswordInput.css
│   │   │   ├── RoleSelector.jsx
│   │   │   ├── RoleSelector.css
│   │   │   └── ProtectedRoute.jsx
│   │   ├── services/
│   │   │   └── authService.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Express backend (to be created)
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── auth.js
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── .env
│   ├── server.js
│   └── package.json
│
├── LOGIN_PAGE_DOCUMENTATION.md      # Frontend guide
├── BACKEND_API_SPECIFICATION.md     # Backend requirements
└── QUICK_START_GUIDE.md             # This file
```

---

## Color Reference

Keep these colors consistent across the application:

| Color | Hex Code | Usage |
|-------|----------|-------|
| Primary Dark Purple | #3E0F8D | Main buttons, branding, active states |
| Secondary Purple | #9564DD | Hover states, secondary elements |
| Accent Yellow | #E4DA72 | Small highlights, accents |
| Light Gray | #EEEEEE | Backgrounds, borders, unselected states |
| White | #FFFFFF | Primary background |
| Dark Text | #1a1a1a | Primary text |
| Light Text | #666666 | Secondary text |
| Error Red | #DC2626 | Error messages |
| Success Green | #10B981 | Success messages |

---

## Support & Documentation

- **Frontend Details**: See [LOGIN_PAGE_DOCUMENTATION.md](LOGIN_PAGE_DOCUMENTATION.md)
- **Backend API**: See [BACKEND_API_SPECIFICATION.md](BACKEND_API_SPECIFICATION.md)
- **Frontend Code**: Check inline JSDoc comments in component files
- **Issues**: Review error messages in console and browser DevTools

---

## Deployment

### Frontend Deployment (Vercel, Netlify, etc.)

```bash
npm run build
# Deploy the dist/ folder
```

### Backend Deployment (Heroku, AWS, etc.)

Set environment variables:
- `PORT`: 5000
- `MONGODB_URI`: Your production MongoDB connection
- `JWT_SECRET`: Secure random string (32+ characters)
- `CLIENT_URL`: Production frontend URL

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Maintained By**: TutorFlow Development Team

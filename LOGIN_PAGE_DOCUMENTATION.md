# TutorFlow Login Page - Implementation Guide

## Overview

This document outlines the professional login page implementation for TutorFlow, an online tutoring session management platform. The login page supports two user roles: Tutors and Students.

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── InputField.jsx              # Reusable email/text input component
│   │   ├── InputField.css
│   │   ├── PasswordInput.jsx           # Password input with visibility toggle
│   │   ├── PasswordInput.css
│   │   ├── RoleSelector.jsx            # Tutor/Student role selector
│   │   ├── RoleSelector.css
│   │   ├── LoginForm.jsx               # Main login form component
│   │   ├── LoginForm.css
│   │   └── ProtectedRoute.jsx          # Role-based route protection
│   ├── pages/
│   │   ├── LoginPage.jsx               # Main login page with split layout
│   │   ├── LoginPage.css
│   │   ├── TutorDashboard.jsx          # Tutor dashboard (placeholder)
│   │   └── StudentDashboard.jsx        # Student dashboard (placeholder)
│   ├── services/
│   │   └── authService.js              # Authentication API client
│   ├── App.jsx                         # Route configuration
│   ├── App.css
│   ├── main.jsx
│   └── index.css                       # Global styles with Montserrat
└── package.json
```

## Color Palette

The application uses a carefully curated color palette:

- **Primary Dark Purple**: `#3E0F8D` - Primary buttons, branding, active states
- **Secondary Purple**: `#9564DD` - Hover states, secondary accents
- **Accent Yellow**: `#E4DA72` - Limited accent use for highlights
- **Light Gray**: `#EEEEEE` - Input backgrounds, borders, unselected states
- **White**: `#FFFFFF` - Primary background
- **Text Dark**: `#1a1a1a` - Primary text
- **Text Light**: `#666666` - Secondary text
- **Error Red**: `#DC2626` - Error messages
- **Success Green**: `#10B981` - Success messages

## Features Implemented

### 1. Split-Screen Layout
- **Left Section (45%)**: Purple brand display with gradient background, decorative pattern
- **Right Section (55%)**: White background with centered login form
- Responsive: Hides left section on mobile, takes full width on mobile

### 2. Role Selector
- Two buttons: "Tutor" and "Student"
- Visual feedback for selected role
- Smooth transitions on selection
- Updates form context (heading and subheading) when role changes

### 3. Login Form Components
- **Email Field**: Standard input with validation
- **Password Field**: Input with show/hide toggle using Lucide icons
- **Login Button**: Full-width primary button with loading state
- **Forgot Password Link**: Placeholder link
- **Security Footer**: Lock icon with "Secure access" message

### 4. Input Validation
- Email validation using regex pattern
- Password minimum length requirement (6 characters)
- Real-time error clearing as user types
- Error messages display below fields
- General error message display for login failures

### 5. Loading State
- Button disables during submission
- Button text changes to "Logging in..."
- All inputs disabled during submission
- Prevents double-submission

### 6. Password Visibility Toggle
- Eye icon from Lucide React
- Toggle between password and text view
- Accessible keyboard navigation

### 7. Authentication Flow
- POST to `/api/auth/login` with email, password, role
- Token stored in localStorage
- Role stored in localStorage for routing
- Automatic redirect based on user role:
  - Tutors → `/tutor/dashboard`
  - Students → `/student/dashboard`

### 8. Route Protection
- `ProtectedRoute` component checks authentication
- Verifies user role matches required role
- Redirects unauthenticated users to login
- Redirects users accessing wrong role's routes to login

## Component Architecture

### InputField Component
Reusable component for text/email inputs.
```jsx
<InputField
  label="Email address"
  id="email"
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={handleEmailChange}
  error={errors.email}
  disabled={isLoading}
/>
```

### PasswordInput Component
Specialized component for password input with visibility toggle.
```jsx
<PasswordInput
  id="password"
  placeholder="Enter your password"
  value={password}
  onChange={handlePasswordChange}
  error={errors.password}
  disabled={isLoading}
/>
```

### RoleSelector Component
Button group for selecting user role.
```jsx
<RoleSelector 
  selectedRole={selectedRole} 
  onRoleChange={handleRoleChange} 
/>
```

### LoginForm Component
Main form container with validation logic.
```jsx
<LoginForm 
  onLoginSuccess={handleLoginSuccess} 
  isLoading={isLoading} 
/>
```

### ProtectedRoute Component
Wrapper for authenticated routes.
```jsx
<Route
  path="/tutor/dashboard"
  element={
    <ProtectedRoute requiredRole="tutor">
      <TutorDashboard />
    </ProtectedRoute>
  }
/>
```

## Authentication Service

The `authService.js` module handles all authentication operations:

```javascript
// Login user
authService.login(email, password, role)

// Logout user
authService.logout()

// Get stored token
authService.getToken()

// Get user role
authService.getUserRole()

// Check if authenticated
authService.isAuthenticated()

// Get authorization header for API requests
authService.getAuthHeader()
```

### API Base URL Configuration

By default, the API client targets `http://localhost:5000/api`. 

To configure a different URL, set the environment variable:
```bash
REACT_APP_API_URL=https://your-api-domain.com/api
```

## Backend API Requirements

### Login Endpoint
**POST** `/api/auth/login`

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "userpassword",
  "role": "tutor" // or "student"
}
```

#### Response (Success - 200)
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "tutor"
  }
}
```

#### Response (Failure - 401/400)
```json
{
  "message": "Invalid email or password"
}
```

### Backend Validation

The backend **MUST**:

1. **Verify Email and Password**
   - Check against stored user records
   - Hash passwords using bcrypt or similar
   - Return 401 if credentials invalid

2. **Verify User Role**
   - Confirm the authenticated user's role matches the requested role
   - Prevent students from logging in as tutors or vice versa
   - Return 401 if role mismatch

3. **Generate JWT Token**
   - Include user ID, email, and role in token payload
   - Use secure signing key
   - Include expiration time (recommended: 24 hours)

4. **Return Token**
   - Send JWT in response body
   - Frontend stores in localStorage
   - Send with Authorization header in future requests

### Backend Role-Based Access Control

The backend should implement role-based access control for all protected endpoints:

```javascript
// Example Node.js/Express middleware
const verifyRole = (requiredRole) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.role !== requiredRole) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ message: 'Invalid token' });
    }
  };
};

// Usage
app.get('/api/tutor/sessions', verifyRole('tutor'), getTutorSessions);
app.get('/api/student/sessions', verifyRole('student'), getStudentSessions);
```

## Styling Details

### Typography

- **Font Family**: Montserrat (imported from Google Fonts)
- **Main Heading**: 24px, weight 700
- **Sub-heading**: 14px, weight 400
- **Labels**: 13px, weight 600
- **Input Text**: 15px, weight 400
- **Buttons**: 15px, weight 600
- **Supporting Text**: 14px, weight 400

### Border Radius

- **Inputs**: 8px
- **Buttons**: 8px
- **Role Selector**: 8px
- **Login Card**: Inherits from parent (not separately rounded)
- **Logo**: 12px (gradient background)

### Shadows

- **Subtle**: Used sparingly for elevation
- **Login Button**: `0 2px 8px rgba(62, 15, 141, 0.15)`
- **Login Button Hover**: `0 4px 12px rgba(149, 100, 221, 0.2)`
- **Logo**: `0 4px 12px rgba(62, 15, 141, 0.2)`

### Responsive Breakpoints

- **Desktop**: 1200px+
  - Split-screen layout (45/55)
  - Full brand section visible

- **Tablet**: 768px - 1200px
  - Adjusted widths
  - Reduced font sizes
  - Maintained split layout

- **Mobile**: Below 768px
  - Single column layout
  - Left section hidden
  - Full screen login form
  - 20px horizontal padding

## Development

### Running the Development Server

```bash
cd client
npm run dev
```

Server runs on `http://localhost:5173` by default.

### Building for Production

```bash
cd client
npm run build
```

Output is in the `dist/` directory.

### Linting

```bash
cd client
npm run lint
```

## Testing the Login Page

### Test Cases

1. **Email Validation**
   - Empty email → shows "Email address is required"
   - Invalid email format → shows "Please enter a valid email address"
   - Valid email → no error

2. **Password Validation**
   - Empty password → shows "Password is required"
   - Password < 6 characters → shows "Password must be at least 6 characters"
   - Valid password → no error

3. **Role Switching**
   - Click "Tutor" → heading updates to "Welcome back, Tutor"
   - Click "Student" → heading updates to "Welcome back, Student"
   - Form content remains the same

4. **Password Visibility**
   - Click eye icon → password becomes visible (type="text")
   - Click eye icon again → password becomes hidden (type="password")

5. **Loading State**
   - Click "Log In" → button shows "Logging in..."
   - All inputs disabled
   - Form cannot be submitted again

6. **Error Handling**
   - Invalid credentials → shows general error message
   - Network error → shows "An error occurred. Please try again."
   - All fields remain enabled for retry

7. **Successful Login**
   - Valid credentials + tutor role → redirects to `/tutor/dashboard`
   - Valid credentials + student role → redirects to `/student/dashboard`
   - Token stored in localStorage
   - Role stored in localStorage

## Security Considerations

1. **Frontend Security**
   - Passwords never logged or displayed in console
   - Token stored in localStorage (consider httpOnly cookies for production)
   - Role selector is UI-only; backend must verify

2. **Backend Security**
   - ALWAYS verify role server-side
   - Never trust role from frontend
   - Use HTTPS for production
   - Implement rate limiting for login attempts
   - Hash passwords with bcrypt (salt rounds: 10+)
   - Use secure JWT signing key (minimum 32 bytes)
   - Set JWT expiration (recommended: 24 hours)
   - Implement refresh token mechanism for long sessions

3. **API Security**
   - Validate all input on backend
   - Implement CORS properly
   - Use environment variables for sensitive config
   - Add API request logging
   - Implement request signing for critical endpoints

## Future Enhancements

1. **Two-Factor Authentication**
   - SMS verification
   - Authenticator app support

2. **Forgot Password Flow**
   - Email reset link
   - Token verification
   - Password reset form

3. **Social Authentication**
   - Google OAuth
   - Microsoft OAuth

4. **Session Management**
   - Refresh token rotation
   - Session timeout handling
   - Device management

5. **Analytics**
   - Login success/failure tracking
   - User engagement metrics
   - Performance monitoring

## Dependencies

- `react` (^19.2.8) - UI framework
- `react-dom` (^19.2.8) - DOM rendering
- `react-router-dom` - Client-side routing
- `axios` - HTTP client for API requests
- `lucide-react` - Icon library (Eye/EyeOff for password toggle)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern mobile browsers

## Performance

- Initial load: ~290KB (gzipped ~95KB)
- Component bundle optimized with code-splitting
- CSS modules loaded per-component
- Icon library tree-shaking enabled

## License

All code is proprietary and confidential to TutorFlow.

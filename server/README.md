# TutorFlow Backend API 🚀

Production-ready backend API service for **TutorFlow**, an online tutoring platform with strict server-side Role-Based Access Control (RBAC), multi-tenant data isolation, session lifecycle state enforcement, and extensible AI-assisted lesson planning & review capabilities.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture & Folder Structure](#architecture--folder-structure)
4. [Security & Core Principles](#security--core-principles)
   - [Why the Frontend Role Selector is NOT Trusted](#1-why-the-frontend-role-selector-is-not-trusted)
   - [How the Backend Prevents Students from Accessing Tutor Data](#2-how-the-backend-prevents-students-from-accessing-tutor-data)
   - [How the Backend Prevents Cross-Tutor Data Leakage](#3-how-the-backend-prevents-cross-tutor-data-leakage)
5. [Database Models & Relationships](#database-models--relationships)
   - [Entity Relationship Diagram](#entity-relationship-diagram)
   - [Database Indexes](#database-indexes)
6. [Session Lifecycle State Machine](#session-lifecycle-state-machine)
7. [Authentication & Authorization Flow](#authentication--authorization-flow)
8. [API Specification & Endpoints](#api-specification--endpoints)
9. [Getting Started & Local Setup](#getting-started--local-setup)
10. [Environment Variables](#environment-variables)
11. [Database Seeding & Test Credentials](#database-seeding--test-credentials)
12. [Automated Testing & Postman Collection](#automated-testing--postman-collection)

---

## Project Overview

TutorFlow connects tutors with their private students. The system strictly separates permissions:
- **Tutors** can log in, create student accounts, manage student profiles, schedule tutoring sessions, write live lesson notes, generate AI plans/reviews, and track student progress.
- **Students** can log in, view their own profile, track upcoming sessions, read session notes in read-only mode once completed, and access assigned homework.
- **No Public Registration**: All student accounts are created directly by authenticated tutors.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js (v18+)** | JavaScript runtime environment |
| **Express.js (v4.19+)** | Web application framework |
| **MongoDB & Mongoose (v8.5+)** | Document database and object data modeling (ODM) |
| **JSON Web Tokens (jsonwebtoken)** | Cryptographic stateless user authentication |
| **bcryptjs** | Adaptive salted password hashing |
| **express-validator** | Request payload sanitization and validation |
| **cookie-parser** | HTTP-only cookie management |
| **cors** | Cross-Origin Resource Sharing security |
| **helmet** | HTTP security headers |
| **express-rate-limit** | Brute-force protection on authentication endpoints |
| **morgan** | HTTP request logging |
| **dotenv** | Environment configuration management |

---

## Architecture & Folder Structure

The server follows a clean **MVC / Service Layer** architecture for complete separation of concerns:

```
server/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & graceful termination
│   ├── controllers/
│   │   ├── auth.controller.js     # Login, me, logout handlers
│   │   ├── tutor.controller.js    # Student management & tutor queries
│   │   ├── student.controller.js  # Student profile, sessions, homework
│   │   └── session.controller.js  # Scheduling, status transitions, notes
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT extraction & DB verification
│   │   ├── role.middleware.js     # RBAC authorization guards
│   │   ├── error.middleware.js    # Centralized error & 404 handler
│   │   └── validate.middleware.js # Express-validator runner
│   ├── models/
│   │   ├── User.js                # User collection schema & bcrypt hook
│   │   ├── StudentProfile.js      # Student profile & learning goals
│   │   └── Session.js             # Session collection & AI review schemas
│   ├── routes/
│   │   ├── auth.routes.js         # /api/auth
│   │   ├── tutor.routes.js        # /api/tutors
│   │   ├── student.routes.js      # /api/students
│   │   └── session.routes.js      # /api/sessions
│   ├── services/
│   │   ├── auth.service.js        # Authentication & credential validation logic
│   │   └── session.service.js     # State transition & conflict detection logic
│   ├── utils/
│   │   ├── apiError.js            # Custom HTTP Error class
│   │   ├── asyncHandler.js        # Async error wrapper
│   │   └── generateToken.js       # JWT signing & cookie configuration
│   ├── scripts/
│   │   └── seed.js                # Database seeder (idempotent)
│   ├── app.js                     # Express app configuration & middleware
│   └── server.js                  # Server entry point & listener
├── tests/
│   └── api.test.js                # End-to-end API test suite (20 test cases)
├── postman/
│   └── TutorFlow.postman_collection.json  # Postman / Thunder Client collection
├── .env                           # Local environment variables
├── .env.example                   # Example environment templates
├── package.json                   # Dependencies and scripts
└── README.md                      # Backend documentation
```

---

## Security & Core Principles

### 1. Why the Frontend Role Selector is NOT Trusted
In single-page applications (like React), the client-side role selector or local state is strictly a **User Interface convenience**. Any client-side state or request body claim can be intercepted, spoofed, or manipulated via DevTools or Postman.
- **Backend Verification**: When a user logs in, the backend finds the user document in MongoDB, verifies their hashed password with bcrypt, and checks that their actual database `role` matches the requested role.
- **Server-Issued JWT**: The verified role is encoded into a signed JWT (`HS256`).
- **Authorization Authority**: All subsequent requests use the verified `req.user.role` from the database/token. Any role passed in `req.body.role` or `req.params.role` is completely ignored for authorization.

### 2. How the Backend Prevents Students from Accessing Tutor Data
- **Route Guards**: Every tutor endpoint is wrapped with `requireAuth` and `requireRole('tutor')`.
- **RBAC Middleware**: If a user authenticated as `student` attempts to call `/api/tutors/*` or `POST /api/sessions`, the `requireRole` middleware intercepts the request immediately and terminates with `403 Forbidden` (`{ success: false, message: "Access denied: insufficient permissions" }`).
- **Student Data Scoping**: On student endpoints (`/api/students/sessions`, `/api/students/me`, `/api/students/homework`), the queries are hardcoded to `req.user._id`. Students cannot specify another user's ID to view their data.

### 3. How the Backend Prevents Cross-Tutor Data Leakage
- **Automatic Tutor Scoping**: When a tutor creates a student account, the backend forcefully sets `tutorId: req.user._id`. The client cannot choose or inject a `tutorId`.
- **Query Scoping**: When a tutor lists students (`GET /api/tutors/students`), the database query strictly applies:
  ```javascript
  { role: 'student', tutorId: req.user._id }
  ```
- **Isolated Resource Access**: When a tutor requests a specific student (`GET /api/tutors/students/:studentId`), the query filters by both `_id: studentId` AND `tutorId: req.user._id`. If a tutor tries to query another tutor's student, the database returns `null`, and the API responds with `404 Not Found` without disclosing whether the resource exists.
- **Double-Booking & Session Isolation**: Tutors can only manage sessions where `session.tutorId === req.user._id`.

---

## Database Models & Relationships

### Entity Relationship Diagram

```
+-------------------------------------------------------------+
|                         User Model                          |
+-------------------------------------------------------------+
| _id: ObjectId                                               |
| name: String                                                |
| email: String (unique, lowercase)                           |
| password: String (bcrypt hash, select: false)               |
| role: 'tutor' | 'student'                                   |
| tutorId: ObjectId (ref: User, null for tutors)              |
| isActive: Boolean (default: true)                           |
| lastLogin: Date                                             |
| createdAt / updatedAt: Date                                 |
+-------------------------------------------------------------+
               | (1)                               | (1)
               | assigns                           | schedules
               v (many)                            v (many)
+------------------------------------+  +-------------------------------------+
|        StudentProfile Model        |  |            Session Model            |
+------------------------------------+  +-------------------------------------+
| _id: ObjectId                      |  | _id: ObjectId                       |
| userId: ObjectId (unique, ref:User)|  | tutorId: ObjectId (ref: User)       |
| tutorId: ObjectId (ref: User)      |  | studentId: ObjectId (ref: User)     |
| name: String                       |  | scheduledAt: Date                   |
| subject: String                    |  | topic: String                       |
| currentLevel: String               |  | status: scheduled | in_progress |   |
| learningGoals: String              |  |         completed | ai_reviewed     |
| weakAreas: String                  |  | notes: String (editable in_progress)|
| createdAt / updatedAt: Date        |  | aiPlan: {                           |
+------------------------------------+  |   learningObjectives: [String],     |
                                        |   lessonOutline: [String],          |
                                        |   practiceQuestions: [String]       |
                                        | }                                   |
                                        | aiReview: {                         |
                                        |   summary: String,                  |
                                        |   homework: [String],               |
                                        |   nextSessionSuggestion: String     |
                                        | }                                   |
                                        | createdAt / updatedAt: Date         |
                                        +-------------------------------------+
```

### Database Indexes

- **User**:
  - `{ email: 1 }` (unique index for ultra-fast login lookups and uniqueness guarantee)
  - `{ tutorId: 1 }` (index for fetching all students belonging to a tutor)
  - `{ role: 1 }` (index for role filtering)
- **StudentProfile**:
  - `{ userId: 1 }` (unique index for 1-to-1 profile mapping)
  - `{ tutorId: 1 }` (index for tutor profile queries)
- **Session**:
  - `{ tutorId: 1 }` (index for tutor sessions)
  - `{ studentId: 1 }` (index for student sessions)
  - `{ scheduledAt: 1 }` (index for chronological sorting & date filters)
  - `{ status: 1 }` (index for session status queries)
  - `{ tutorId: 1, scheduledAt: 1 }` (compound index for fast double-booking conflict detection)

---

## Session Lifecycle State Machine

The session model enforces a strict, unidirectional state machine:

```
[ scheduled ]
      │
      ▼
[ in_progress ]  <--- (Live notes autosave enabled)
      │
      ▼
[ completed ]    <--- (Notes become permanently READ-ONLY)
      │
      ▼
[ ai_reviewed ]  <--- (AI Summary, Homework & Suggestions generated)
```

### State Machine Rules
1. **No State Skipping**:
   - `scheduled` -> `completed` ❌ **REJECTED (400 Bad Request)**
   - `scheduled` -> `ai_reviewed` ❌ **REJECTED (400 Bad Request)**
   - `in_progress` -> `ai_reviewed` ❌ **REJECTED (400 Bad Request)**
   - `completed` -> `scheduled` ❌ **REJECTED (400 Bad Request)**
2. **Notes Immutability**:
   - Notes can **only** be modified while the session status is `in_progress`.
   - Once a session transitions to `completed` or `ai_reviewed`, notes become strictly read-only. Modifying notes returns `400 Bad Request`.
3. **Double-Booking Prevention**:
   - When scheduling a session, the backend checks for conflicts within the scheduled time window.
   - If an existing session overlaps, the server rejects the request with `409 Conflict`.

---

## Authentication & Authorization Flow

```
Client (React / Postman)                  Server (Express + JWT)               Database (MongoDB)
       │                                            │                                  │
       │── POST /api/auth/login ───────────────────>│                                  │
       │   { email, password, role }                │── Find user by email ───────────>│
       │                                            │<── User doc with password hash ──│
       │                                            │                                  │
       │                                            │── bcrypt.compare()               │
       │                                            │── Check role === db.role         │
       │                                            │── jwt.sign({ userId, role })     │
       │<── 200 OK ─────────────────────────────────│                                  │
       │    Set-Cookie: token=... (HTTP-Only)       │                                  │
       │    { token, user: { id, name, role } }     │                                  │
       │                                            │                                  │
       │── GET /api/tutors/students ───────────────>│                                  │
       │   Header: Authorization: Bearer <token>    │── jwt.verify(token)              │
       │   (or HTTP-Only Cookie)                    │── requireRole('tutor')           │
       │                                            │── Find students (tutorId=user) ─>│
       │                                            │<── Filtered student list ────────│
       │<── 200 OK with Data ───────────────────────│                                  │
```

---

## API Specification & Endpoints

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Login with email, password, and role. Returns JWT & sets HTTP-only cookie. |
| `GET` | `/api/auth/me` | Private | Get authenticated user profile. |
| `POST` | `/api/auth/logout` | Private/Public | Clear auth cookie and end session. |

### 2. Tutor Endpoints (`/api/tutors`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/tutors/students` | Tutor only | Create a new student account & student profile. |
| `GET` | `/api/tutors/students` | Tutor only | List all students assigned to the authenticated tutor. |
| `GET` | `/api/tutors/students/:studentId` | Tutor only | Get student details, profile, and recent sessions. |

### 3. Student Endpoints (`/api/students`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/students/me` | Student only | Get authenticated student's profile & learning metrics. |
| `GET` | `/api/students/sessions` | Student only | Get all upcoming and past sessions for the student. |
| `GET` | `/api/students/homework` | Student only | Get all homework assignments generated from sessions. |

### 4. Session Endpoints (`/api/sessions`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/sessions` | Tutor only | Schedule a new session (with double-booking checks). |
| `GET` | `/api/sessions/:sessionId` | Tutor / Assigned Student | Get session details (verified ownership). |
| `PATCH` | `/api/sessions/:sessionId/status` | Tutor only | Transition session lifecycle status. |
| `PATCH` | `/api/sessions/:sessionId/notes` | Tutor only | Update session notes (in_progress status only). |

### 5. Health Check

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | API health check and server status. |

---

## Getting Started & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20+ recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally or MongoDB Atlas URI

### Installation

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment:
   Copy `.env.example` to `.env` (or use the pre-configured `.env`):
   ```bash
   cp .env.example .env
   ```

4. Seed the Database:
   ```bash
   npm run seed
   ```

5. Start the Server:
   - **Development mode (with auto-reload)**:
     ```bash
     npm run dev
     ```
   - **Production mode**:
     ```bash
     npm start
     ```

Server will start on `http://localhost:5000`.

---

## Environment Variables

| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `5000` | HTTP port the server listens on |
| `NODE_ENV` | `development` | Environment mode (`development`, `production`, `test`) |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/tutorflow` | MongoDB connection string |
| `JWT_SECRET` | *(secret string)* | Cryptographic key for signing JWT tokens |
| `JWT_EXPIRES_IN` | `7d` | Token validity duration |
| `COOKIE_EXPIRES_IN`| `7` | Cookie expiration in days |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS frontend origin |

---

## Database Seeding & Test Credentials

Run the seeder at any time to populate or reset test accounts:

```bash
npm run seed
```

### Default Test Accounts

| Role | Email | Password | Details |
|---|---|---|---|
| **Tutor** | `tutor@tutorflow.com` | `Tutor@123` | Name: *Prof. Sarah Jenkins* |
| **Student** | `student@tutorflow.com` | `Student@123` | Name: *Alex Rivera* (Assigned to Prof. Sarah Jenkins) |

*The seed script also creates sample sessions in `scheduled`, `in_progress`, and `ai_reviewed` states with AI plans, notes, and homework tasks.*

---

## Automated Testing & Postman Collection

### Running Automated Test Suite

The repository includes a comprehensive 20-point automated test suite:

```bash
npm test
```

### Test Coverage Checklist:
- [x] Tutor login with valid credentials & password omission check
- [x] Student login with valid credentials
- [x] Role mismatch login rejection (401 Unauthorized)
- [x] Authenticated `/api/auth/me` inspection
- [x] Tutor creating student account and `StudentProfile`
- [x] Tutor retrieving only their own students
- [x] Tutor retrieving student detail & profile
- [x] Student retrieving their own profile
- [x] Tutor scheduling a new session
- [x] Double-booking prevention at conflicting times (409 Conflict)
- [x] State skipping rejection (e.g. `scheduled` -> `completed`) (400 Bad Request)
- [x] State transition: `scheduled` -> `in_progress`
- [x] Updating notes during `in_progress`
- [x] State transition: `in_progress` -> `completed`
- [x] Notes read-only enforcement on completed session (400 Bad Request)
- [x] State transition: `completed` -> `ai_reviewed` with AI feedback & homework
- [x] RBAC guard: Student blocked from tutor endpoints (403 Forbidden)
- [x] Multi-tenant isolation: Secondary tutor blocked from accessing another tutor's student (404/403)
- [x] Student retrieving assigned homework from completed sessions

### Postman / Thunder Client Collection
Import `postman/TutorFlow.postman_collection.json` directly into Postman or VS Code Thunder Client for testing with pre-configured requests and token scripts.

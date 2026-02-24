# Habit Tracker Backend API

A production-ready REST API for a Habit Tracker application built with **Node.js**, **Express.js**, and **MongoDB Atlas**, featuring **JWT authentication**, daily tracking, and a progress dashboard with streaks & analytics.

---

## 🚀 Local Setup

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd habit-tracker-backend
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```
Edit `.env` with your values:
```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/habittracker?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
```

### 3. Run the Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server starts at `http://localhost:5000`

---

## 📁 Project Structure

```
habit-tracker-backend/
├── server.js                  # Entry point
├── .env.example               # Environment variable template
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB Atlas connection
│   ├── models/
│   │   ├── User.js            # User schema (name, email, password)
│   │   ├── Habit.js           # Habit schema (title, description, userId)
│   │   └── HabitLog.js        # Completion log (habitId, date - unique per day)
│   ├── controllers/
│   │   ├── authController.js       # Register, Login, GetMe
│   │   ├── habitController.js      # Habit CRUD
│   │   ├── trackingController.js   # Complete habit, Get logs
│   │   └── dashboardController.js  # Stats, Streaks, Weekly progress
│   ├── middleware/
│   │   ├── auth.js            # JWT protection middleware
│   │   ├── validate.js        # express-validator error collector
│   │   └── errorHandler.js    # Global error handler
│   └── routes/
│       ├── authRoutes.js
│       ├── habitRoutes.js
│       └── dashboardRoutes.js
```

---

## 🗄️ Database Schema

### User
| Field     | Type   | Notes             |
|-----------|--------|-------------------|
| name      | String | required, max 50  |
| email     | String | unique, lowercase |
| password  | String | bcrypt hashed     |

### Habit
| Field       | Type    | Notes                    |
|-------------|---------|--------------------------|
| userId      | ObjectId| ref: User                |
| title       | String  | required, max 100        |
| description | String  | optional, max 500        |
| isActive    | Boolean | soft-delete flag         |

### HabitLog
| Field         | Type     | Notes                                     |
|---------------|----------|-------------------------------------------|
| habitId       | ObjectId | ref: Habit                               |
| userId        | ObjectId | ref: User                                |
| completedDate | String   | YYYY-MM-DD, unique per habit per day     |

---

## 🔌 API Endpoints

All protected routes require the `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint              | Access  | Description          |
|--------|-----------------------|---------|----------------------|
| POST   | `/api/auth/register`  | Public  | Register a new user  |
| POST   | `/api/auth/login`     | Public  | Login & get JWT      |
| GET    | `/api/auth/me`        | 🔒 Auth | Get current user     |

**Register Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (Register / Login):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { "id": "...", "name": "John Doe", "email": "john@example.com" }
}
```

---

### Habits

| Method | Endpoint                     | Access  | Description                      |
|--------|------------------------------|---------|----------------------------------|
| GET    | `/api/habits`                | 🔒 Auth | Get all habits (with today status)|
| POST   | `/api/habits`                | 🔒 Auth | Create a new habit               |
| GET    | `/api/habits/:id`            | 🔒 Auth | Get single habit                 |
| PUT    | `/api/habits/:id`            | 🔒 Auth | Update habit title/description   |
| DELETE | `/api/habits/:id`            | 🔒 Auth | Soft-delete a habit              |

**Create/Update Habit Body:**
```json
{
  "title": "Morning Run",
  "description": "Run 5km every morning before 7am"
}
```

**Habit Response Object:**
```json
{
  "_id": "...",
  "userId": "...",
  "title": "Morning Run",
  "description": "Run 5km every morning before 7am",
  "isActive": true,
  "completedToday": false,
  "createdAt": "2026-02-23T00:00:00.000Z"
}
```

---

### Daily Tracking

| Method | Endpoint                     | Access  | Description                              |
|--------|------------------------------|---------|------------------------------------------|
| POST   | `/api/habits/:id/complete`   | 🔒 Auth | Mark habit complete for today (once only)|
| GET    | `/api/habits/:id/logs`       | 🔒 Auth | Get all completion logs for a habit      |

**Complete Habit Response (success):**
```json
{
  "success": true,
  "message": "Habit marked as completed for today! 🎉",
  "log": { "habitId": "...", "completedDate": "2026-02-23", ... }
}
```

**Complete Habit Response (already done → 409):**
```json
{
  "success": false,
  "message": "Habit already completed for today."
}
```

---

### Progress Dashboard

| Method | Endpoint                     | Access  | Description                     |
|--------|------------------------------|---------|---------------------------------|
| GET    | `/api/dashboard`             | 🔒 Auth | Overall stats across all habits |
| GET    | `/api/habits/:id/progress`   | 🔒 Auth | Per-habit progress analytics    |

**Dashboard Response:**
```json
{
  "success": true,
  "stats": {
    "totalHabits": 5,
    "completedToday": 3,
    "completionPercentageToday": 60,
    "currentStreak": 7,
    "longestStreak": 14,
    "totalCompletions": 102,
    "weeklyProgress": [
      { "date": "2026-02-17", "completed": 4, "total": 5 },
      { "date": "2026-02-18", "completed": 5, "total": 5 },
      { "date": "2026-02-19", "completed": 3, "total": 5 },
      { "date": "2026-02-20", "completed": 5, "total": 5 },
      { "date": "2026-02-21", "completed": 4, "total": 5 },
      { "date": "2026-02-22", "completed": 5, "total": 5 },
      { "date": "2026-02-23", "completed": 3, "total": 5 }
    ]
  }
}
```

**Per-Habit Progress Response:**
```json
{
  "success": true,
  "habit": { "id": "...", "title": "Morning Run", "createdAt": "..." },
  "progress": {
    "totalCompletions": 20,
    "currentStreak": 7,
    "daysSinceCreation": 30,
    "completionRate": 67,
    "weeklyProgress": [
      { "date": "2026-02-17", "completed": true },
      { "date": "2026-02-18", "completed": false },
      ...
    ],
    "allCompletedDates": ["2026-02-23", "2026-02-22", ...]
  }
}
```

---

## ⚠️ Error Responses

All errors follow this structure:
```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

| Status | Meaning                              |
|--------|--------------------------------------|
| 400    | Bad Request / Validation Error       |
| 401    | Unauthorized (missing/invalid token) |
| 404    | Resource not found                   |
| 409    | Conflict (duplicate email/completion)|
| 422    | Unprocessable Entity (validation)    |
| 500    | Internal Server Error                |

---

## 🛠️ Tech Stack

| Layer       | Technology                         |
|-------------|-------------------------------------|
| Runtime     | Node.js                             |
| Framework   | Express.js                          |
| Database    | MongoDB Atlas (via Mongoose)        |
| Auth        | JSON Web Tokens (jsonwebtoken)      |
| Encryption  | bcryptjs                            |
| Validation  | express-validator                   |
| Security    | helmet, cors                        |
| Logging     | morgan                              |

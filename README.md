# 🚀 NIET Assignment Tracker

Complete assignment management system with role-based access for Students and Admins.

## ✨ Features

- **Dual Role System**: Admin & Student login
- **Admin Panel**: Create assignments and assign to all students
- **Student Portal**: View assignments, submit work, get notifications
- **Real-time Notifications**: Get alerted when new assignments are assigned
- **Assignment Tracking**: Monitor submission status
- **MySQL Database**: Secure data storage

## 📋 Prerequisites

1. **Node.js**: v24.17.0 or higher
2. **npm**: Installed with Node.js
3. **MySQL**: Database server running
4. **Environment File**: Create `.env` in `backend/` folder

## 🔧 Setup

### 1. Create Environment File
Create `backend/.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=niet_assignment_tracker
JWT_SECRET=your_secret_key_here
PORT=5000
```

### 2. Setup Database
- Import `backend/database.sql` into MySQL
- Or run manually in MySQL console

### 3. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

## 🎯 Starting the Application

### Option 1: Run Silently in the Background (Recommended)
Double-click **`RUN_SILENTLY.vbs`** in the root directory.
- This runs the backend and frontend servers quietly in the background without keeping any CMD windows open.
- Server logs will be written to `backend_log.txt` and `frontend_log.txt` in the root folder.
- To stop the background servers, double-click **`STOP_SERVERS.bat`**.

### Option 2: Batch Script (Windows CMD with visible terminals)
Double-click **`START.bat`**. This starts both servers in active Command Prompt windows. You must keep these windows open while testing!

### Option 3: PowerShell Script
```bash
powershell -ExecutionPolicy Bypass -File START.ps1
```

### Option 3: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 🌐 Access Application

- **Frontend**: http://localhost:3001
- **Login Page**: http://localhost:3001/login.html
- **Backend API**: http://localhost:5000

## 👤 Sample Credentials

### Admin Login
- **Email**: admin@niet.com
- **Password**: admin123
- **Role**: Admin

### Student Login
- **Email**: raj@niet.com or priya@niet.com
- **Password**: (Register new account)
- **Role**: Student

## 📝 How to Use

### For Admin:
1. Go to http://localhost:3001/login.html
2. Select "Admin" tab
3. Login with admin credentials
4. Click "Create New Assignment"
5. Fill in assignment details
6. Click "Assign to All Students"
7. Assignment appears in all student portals

### For Student:
1. Go to http://localhost:3001/login.html
2. Select "Student" tab
3. Register or login
4. View assigned assignments
5. Click "Submit Assignment"
6. Enter file name
7. Check notifications for updates

## 🗂️ Project Structure

```
new Project/
├── backend/
│   ├── server.js           # API routes & logic
│   ├── database.sql        # Database schema
│   ├── package.json        # Dependencies
│   └── .env                # Environment variables
├── frontend/
│   ├── server.js           # Express server
│   ├── login.html          # Login page (role selector)
│   ├── dashboard.html      # Student dashboard
│   ├── admin-dashboard.html # Admin dashboard
│   ├── api.js              # API calls
│   └── package.json        # Dependencies
├── START.bat               # Windows startup script
├── START.ps1               # PowerShell startup script
└── SETUP_GUIDE.md          # This file
```

## 🔒 Authentication

- JWT-based token authentication
- Role-based access control
- Secure password hashing with bcryptjs
- 7-day token expiration

## 📊 Database Schema

### Users Table
- id, fullName, email, password, role, createdAt

### Assignments Table
- id, adminId, title, description, subject, dueDate, status, createdAt

### Student_Assignments Table
- id, studentId, assignmentId, status, submissionFile, submittedAt, feedback, marks

### Notifications Table
- id, studentId, assignmentId, message, type, isRead, createdAt

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - Register as student
- `POST /api/auth/login` - Login (both roles)

### Admin
- `POST /api/admin/assignments` - Create assignment
- `GET /api/admin/assignments` - View all assignments
- `GET /api/admin/assignments/:id/submissions` - View submissions

### Student
- `GET /api/student/assignments` - View assignments
- `POST /api/student/submit-assignment` - Submit work
- `GET /api/student/notifications` - View notifications
- `PUT /api/student/notifications/:id/read` - Mark as read

## ⚠️ Troubleshooting

### Port Already in Use
```bash
# Kill process on port
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Database Connection Error
- Check MySQL is running
- Verify .env credentials
- Ensure database exists

### Dependencies Missing
```bash
cd backend && npm install
cd frontend && npm install
```

## 📞 Support

For issues, check:
1. Backend console logs (Terminal 1)
2. Frontend browser console (F12)
3. MySQL connection status

---

**Created**: 2026-06-22 | **Version**: 1.0.0

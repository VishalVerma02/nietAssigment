# 🚀 NIET Assignment Tracker - Complete Setup Guide

## ⚡ Quick Start (5 Minutes)

### Step 1: Start XAMPP
1. Open XAMPP Control Panel
2. Click **Start** next to Apache and MySQL
3. Wait until both are running (green status)

### Step 2: Create Database
1. Open `http://localhost/phpmyadmin`
2. Click on **SQL** tab
3. Copy and paste the contents of `backend/database.sql`
4. Click **Execute**

### Step 3: Install Node.js Dependencies
```powershell
cd backend
npm install
```

### Step 4: Start Backend Server
```powershell
npm start
```

You should see:
```
✅ MySQL Database Connected Successfully
🚀 Server running on http://localhost:5000
```

### Step 5: Test the Application
1. Open `frontend/login.html` in your browser (or use Live Server)
2. Click **Register** to create an account
3. Enter credentials and register
4. Login with your credentials
5. You're in the dashboard!

---

## 📋 Project Structure

```
new Project/
├── backend/
│   ├── server.js           # Main backend file
│   ├── package.json        # Dependencies
│   ├── .env               # Configuration
│   ├── database.sql       # Database schema
│   └── README.md          # Backend docs
├── frontend/
│   ├── index.html         # Home page
│   ├── login.html         # Login page
│   ├── register.html      # Registration page
│   ├── dashboard.html     # Main dashboard
│   ├── api.js             # API integration
│   ├── javascript.js      # UI interactions
│   ├── style.css          # Styling
│   └── assignment.css     # Assignment styles
```

---

## 🔧 Backend APIs

### Authentication
- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - Login user

### Assignments
- **GET** `/api/assignments` - Get all assignments (requires token)
- **POST** `/api/assignments` - Create assignment (requires token)
- **PUT** `/api/assignments/:id` - Update assignment (requires token)
- **DELETE** `/api/assignments/:id` - Delete assignment (requires token)

---

## 🛠️ Configuration

### .env File
```
PORT=5000                              # Backend port
DB_HOST=localhost                      # MySQL host
DB_USER=root                           # MySQL username
DB_PASSWORD=                           # MySQL password (usually empty for XAMPP)
DB_NAME=niet_assignment_tracker        # Database name
JWT_SECRET=your_secret_key             # Change this for production!
```

---

## 🗄️ Database Tables

### users
- id (Primary Key)
- fullName
- email (Unique)
- password (hashed)
- createdAt

### assignments
- id (Primary Key)
- userId (Foreign Key)
- title
- description
- subject
- dueDate
- status (pending/submitted/completed)
- createdAt
- updatedAt

---

## 📱 Frontend Features

✅ **User Registration** - Create new accounts  
✅ **User Login** - JWT-based authentication  
✅ **Dashboard** - View statistics  
✅ **Assignment Management** - Create, view, delete assignments  
✅ **Real-time Updates** - Live assignment display  
✅ **Responsive Design** - Works on mobile, tablet, desktop  

---

## ❌ Troubleshooting

### "Cannot connect to database"
- ✅ Check if XAMPP MySQL is running
- ✅ Verify credentials in `.env`
- ✅ Check if database is created

### "Port 5000 already in use"
- Change PORT in `.env` to 5001 or 5002
- Restart backend server

### "CORS error"
- Backend already has CORS enabled
- Check if API_URL in api.js is correct

### "Login not working"
- Check browser console (F12)
- Verify backend is running
- Check JWT_SECRET in .env

---

## 🎨 Customization

### Change Port
Edit `.env`:
```
PORT=3000
```

### Change Database
Edit `.env`:
```
DB_NAME=my_custom_db_name
```

### Change JWT Secret
Edit `.env`:
```
JWT_SECRET=my_very_secure_secret_key_123
```

---

## 📚 Sample Usage

### Register
```javascript
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: 'John Doe',
    email: 'john@gmail.com',
    password: 'password123',
    confirmPassword: 'password123'
  })
})
```

### Login
```javascript
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@gmail.com',
    password: 'password123'
  })
})
```

### Get Assignments
```javascript
fetch('http://localhost:5000/api/assignments', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
```

---

## 🚀 Production Tips

1. **Change JWT_SECRET** in `.env` to a strong random string
2. **Use environment variables** for sensitive data
3. **Enable HTTPS** in production
4. **Add input validation** on frontend
5. **Use connection pooling** for database
6. **Add rate limiting** for API endpoints
7. **Hash passwords** before storing (already done!)

---

## 📞 Support

If you encounter any issues:
1. Check the console (F12)
2. Review error messages
3. Verify all services are running
4. Check database connection
5. Restart backend and MySQL

---

**Happy coding! 🎉**

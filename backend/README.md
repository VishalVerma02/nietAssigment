# NIET Assignment Tracker - Backend

## Setup Instructions

### 1. Install Node.js Dependencies
```bash
cd backend
npm install
```

### 2. Create MySQL Database

**Option A: Using phpMyAdmin (XAMPP)**
1. Open `http://localhost/phpmyadmin`
2. Go to SQL tab
3. Copy and paste the contents of `database.sql`
4. Click Execute

**Option B: Using MySQL Command Line**
```bash
mysql -u root -p < database.sql
```

### 3. Configure Environment Variables
Edit `.env` file:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=          # Leave empty if you don't have a password
DB_NAME=niet_assignment_tracker
JWT_SECRET=your_jwt_secret_key_change_this
```

### 4. Start the Backend Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

Server will run on: `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Assignments
- `GET /api/assignments` - Get all assignments (requires token)
- `POST /api/assignments` - Create assignment (requires token)
- `PUT /api/assignments/:id` - Update assignment (requires token)
- `DELETE /api/assignments/:id` - Delete assignment (requires token)

## Important Notes

✅ This backend uses JWT tokens for authentication
✅ All assignment endpoints require an Authorization header with the JWT token
✅ Passwords are hashed using bcryptjs
✅ MySQL connection uses connection pooling for better performance

## Frontend Integration

Update your frontend API calls to use:
```javascript
const API_URL = 'http://localhost:5000/api';

// Example Login
fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
```

## Troubleshooting

**Error: Database connection refused**
- Ensure XAMPP MySQL is running
- Check DB credentials in `.env`

**Port 5000 already in use**
- Change PORT in `.env` to another port (e.g., 5001)

**CORS errors**
- Backend already has CORS enabled for all origins

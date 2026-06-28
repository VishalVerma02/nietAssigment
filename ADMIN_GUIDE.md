# 👨‍🏫 Admin Management Guide

## Overview
This guide helps you manage admin/teacher accounts in the NIET Assignment Tracker system.

---

## 🚀 Quick Start

### Option 1: Using Admin Management Web Panel (Easiest)
1. **Login** as Admin: `admin@gmail.com` / `admin@123`
2. Click **Manage Admins** in the sidebar
3. Click **Add New Admin** tab
4. Fill in the form with admin details
5. Click **Add Admin** button

✅ New admin can now login immediately!

---

### Option 2: Using Command Line Script
```bash
cd backend
node addAdmin.js
```

Then follow the interactive prompts:
- Full Name
- Email
- Password
- Department
- Designation
- Phone Number
- Qualifications
- Years of Experience

✅ Admin added to database!

---

## 📊 Admin Management Panel

### Location
- **URL**: http://localhost:3001/admin-management.html
- **Access**: Admin login required
- **Link**: From Admin Dashboard → "Manage Admins"

### Features

#### View All Admins
- See list of all active admins
- View details: name, email, department, designation, phone, qualifications, experience
- Check active/inactive status

#### Add New Admin
- Fill form with admin details
- Email must be unique
- Password is auto-hashed in database
- Optional fields: department, designation, phone, qualifications, experience

#### Deactivate Admin
- Click "Deactivate" button on admin card
- Admin loses login access but data is preserved
- Can be reactivated by updating database

---

## 🔌 API Endpoints

### List All Admins
```http
GET /api/admin/list
Headers:
  Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
[
  {
    "id": 1,
    "fullName": "Admin User",
    "email": "admin@gmail.com",
    "department": "Computer Science",
    "designation": "Head of Department",
    "phone": "9876543210",
    "qualifications": "B.Tech, M.Tech",
    "experience": 10,
    "isActive": true,
    "createdAt": "2024-01-01T10:00:00.000Z"
  }
]
```

---

### Create New Admin
```http
POST /api/admin/create
Headers:
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

Body:
{
  "fullName": "Dr. Priya Sharma",
  "email": "priya.sharma@niet.com",
  "password": "securePassword123",
  "department": "Information Technology",
  "designation": "Assistant Professor",
  "phone": "9876543211",
  "qualifications": "B.Tech, M.Tech, PhD",
  "experience": 8
}
```

**Response:**
```json
{
  "message": "Admin created successfully",
  "adminId": 2,
  "fullName": "Dr. Priya Sharma",
  "email": "priya.sharma@niet.com"
}
```

---

### Update Admin Details
```http
PUT /api/admin/:id
Headers:
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

Body:
{
  "department": "Computer Science",
  "designation": "Associate Professor",
  "phone": "9876543210",
  "qualifications": "B.Tech, M.Tech, PhD",
  "experience": 12
}
```

---

### Deactivate Admin
```http
DELETE /api/admin/:id
Headers:
  Authorization: Bearer <JWT_TOKEN>
```

---

## 📁 Database Schema

### Admin Table
```sql
CREATE TABLE admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  department VARCHAR(100),
  designation VARCHAR(100),
  phone VARCHAR(15),
  qualifications VARCHAR(255),
  experience INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🔐 Security Notes

✅ **What's Secure:**
- Passwords are hashed with bcryptjs (10 salt rounds)
- Only admin role can manage admins
- JWT authentication required for all endpoints
- Email uniqueness enforced
- Soft delete (isActive flag) preserves history

⚠️ **Best Practices:**
- Use strong passwords
- Don't reuse old passwords
- Store passwords securely
- Change default admin password immediately
- Review active admins regularly

---

## 📝 Example Scenarios

### Scenario 1: Add Multiple Teachers
```bash
# Using command line
node addAdmin.js

# Fill in details for:
# 1. Prof. Rajesh Kumar - CS Department
# 2. Prof. Neha Singh - IT Department
# 3. Prof. Amit Patel - ECE Department
```

### Scenario 2: Manage Department Heads
1. Login as Admin
2. Go to Manage Admins
3. Add new department head
4. View all active department heads
5. Deactivate if person leaves

### Scenario 3: Admin Promotion/Demotion
```bash
# Update admin details via API or panel
PUT /api/admin/:id
{
  "designation": "Head of Department",
  "experience": 15
}
```

---

## 🆘 Troubleshooting

### "Email already exists" error
- Email must be unique
- Use different email for new admin
- Check if admin already registered

### "Access denied" error
- Only admin role can manage admins
- Login with admin account
- Check JWT token validity

### Admin not appearing in list
- Refresh browser (F5)
- Check admin isActive status
- Verify database connection

### Forgot admin password?
```sql
-- Option 1: Update admin (if you have database access)
UPDATE users 
SET password = '$2a$10$91ygP4LbBzJt9LwJ2vXWC.lbPFJZ7Qn5n5lxXQeQ8ydQe3a9xXF56'
WHERE email = 'admin@gmail.com';
-- (This is the hash for: admin@123)

-- Option 2: Add password reset endpoint (feature to implement)
```

---

## 🎯 Future Enhancements

- [ ] Password reset functionality
- [ ] Admin edit profile page
- [ ] Department management
- [ ] Admin activity logs
- [ ] Bulk import admins from CSV
- [ ] Admin roles (super admin, department admin, etc.)
- [ ] Email notifications on admin creation

---

## 📞 Support

For issues or questions:
1. Check this guide
2. Review backend/server.js for API logic
3. Check browser console for errors
4. Review MySQL error logs

---

**Last Updated:** 2024-06-22
**Version:** 1.0.0

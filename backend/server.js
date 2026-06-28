const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
// Uploads serving will be handled after connection pool initialization

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'niet_assignment_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Serve uploaded files statically with a database fallback for ephemeral storage (Render compatibility)
app.get('/uploads/:fileName', async (req, res, next) => {
  const filePath = path.join(uploadsDir, req.params.fileName);
  
  // 1. If file exists on local disk, serve it immediately
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  
  // 2. If file is not on disk, attempt database retrieval (fallback)
  try {
    const connection = await pool.getConnection();
    
    // Check users table (profile pictures)
    const [userRows] = await connection.execute(
      'SELECT profilePic FROM users WHERE profilePic LIKE ? AND profilePic IS NOT NULL',
      [`%${req.params.fileName}`]
    );
    
    if (userRows.length > 0) {
      const dbPic = userRows[0].profilePic;
      if (dbPic.startsWith('data:image')) {
        connection.release();
        const matches = dbPic.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          res.setHeader('Content-Type', matches[1]);
          return res.send(Buffer.from(matches[2], 'base64'));
        }
      }
    }
    
    // Check student_assignments table (assignment submissions)
    const [assignmentRows] = await connection.execute(
      'SELECT submissionFileData FROM student_assignments WHERE submissionFile = ? AND submissionFileData IS NOT NULL',
      [req.params.fileName]
    );
    
    if (assignmentRows.length > 0) {
      const fileData = assignmentRows[0].submissionFileData;
      connection.release();
      const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        res.setHeader('Content-Type', matches[1]);
        res.setHeader('Content-Disposition', `attachment; filename="${req.params.fileName}"`);
        return res.send(Buffer.from(matches[2], 'base64'));
      }
    }
    
    connection.release();
  } catch (dbErr) {
    console.error('Error fetching file from database fallback:', dbErr);
  }
  
  next(); // Fallback to 404/static handler
});

app.use('/uploads', express.static(uploadsDir));

// Initialize default accounts for login
const initializeDefaultAccounts = async (connection) => {
  const defaultAccounts = [
    {
      fullName: 'Admin User',
      email: 'admin@niet.com',
      password: 'admin123',
      role: 'admin',
      adminData: {
        department: 'Computer Science',
        designation: 'Head of Department',
        phone: '9876543210',
        qualifications: 'B.Tech, M.Tech',
        experience: 10,
        isActive: true
      }
    },
    {
      fullName: 'Raj Kumar',
      email: 'raj@niet.com',
      password: 'student123',
      role: 'student'
    },
    {
      fullName: 'Priya Singh',
      email: 'priya@niet.com',
      password: 'student123',
      role: 'student'
    }
  ];

  for (const account of defaultAccounts) {
    const hashedPassword = await bcryptjs.hash(account.password, 10);
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [account.email]
    );

    let userId;

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      await connection.execute(
        'UPDATE users SET fullName = ?, password = ?, role = ? WHERE email = ?',
        [account.fullName, hashedPassword, account.role, account.email]
      );
    } else {
      const [result] = await connection.execute(
        'INSERT INTO users (fullName, email, password, role) VALUES (?, ?, ?, ?)',
        [account.fullName, account.email, hashedPassword, account.role]
      );
      userId = result.insertId;
    }

    if (account.role === 'admin') {
      const [adminRows] = await connection.execute(
        'SELECT id FROM admin WHERE userId = ?',
        [userId]
      );

      if (adminRows.length > 0) {
        await connection.execute(
          'UPDATE admin SET department = ?, designation = ?, phone = ?, qualifications = ?, experience = ?, isActive = ? WHERE userId = ?',
          [
            account.adminData.department,
            account.adminData.designation,
            account.adminData.phone,
            account.adminData.qualifications,
            account.adminData.experience,
            account.adminData.isActive,
            userId
          ]
        );
      } else {
        await connection.execute(
          'INSERT INTO admin (userId, department, designation, phone, qualifications, experience, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            userId,
            account.adminData.department,
            account.adminData.designation,
            account.adminData.phone,
            account.adminData.qualifications,
            account.adminData.experience,
            account.adminData.isActive
          ]
        );
      }
    }
  }
};

// Test Database Connection & Self-Healing Auto-Migration/Initialization
pool.getConnection().then(async (conn) => {
  console.log('✅ MySQL Database Connected Successfully');
  
  // Auto-Migration & Schema Setup
  try {
    // Check if users table exists
    const [tables] = await conn.query("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) {
      console.log('🛠️  Database is empty. Initializing schema from database.sql...');
      const sqlFilePath = path.join(__dirname, 'database.sql');
      if (fs.existsSync(sqlFilePath)) {
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        // Filter out CREATE DATABASE and USE statements to ensure it works on hosted services (Render/Aiven)
        const statements = sqlContent
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.toLowerCase().startsWith('create database') && !stmt.toLowerCase().startsWith('use '));
        
        for (const statement of statements) {
          await conn.query(statement);
        }
        console.log('✅ Database schema initialized successfully!');
      } else {
        console.warn('⚠️ database.sql not found! Cannot initialize empty database schema.');
      }
    } else {
      // Modify columns to LONGTEXT if they are VARCHAR
      try {
        const [profilePicCol] = await conn.query("SHOW COLUMNS FROM users LIKE 'profilePic'");
        if (profilePicCol.length > 0) {
          if (profilePicCol[0].Type.toLowerCase().startsWith('varchar')) {
            await conn.query("ALTER TABLE users MODIFY COLUMN profilePic LONGTEXT DEFAULT NULL");
            console.log('🛠️  Database Auto-Migration: Modified "profilePic" column type to LONGTEXT in "users" table.');
          }
        } else {
          await conn.query("ALTER TABLE users ADD COLUMN profilePic LONGTEXT DEFAULT NULL");
          console.log('🛠️  Database Auto-Migration: Added "profilePic" column to "users" table.');
        }
      } catch (colErr) {
        console.error('Error migrating profilePic column:', colErr);
      }
      
      try {
        const [subFileCol] = await conn.query("SHOW COLUMNS FROM student_assignments LIKE 'submissionFileData'");
        if (subFileCol.length === 0) {
          await conn.query("ALTER TABLE student_assignments ADD COLUMN submissionFileData LONGTEXT DEFAULT NULL");
          console.log('🛠️  Database Auto-Migration: Added "submissionFileData" column to "student_assignments" table.');
        }
      } catch (colErr) {
        console.error('Error migrating submissionFileData column:', colErr);
      }
    }
  } catch (migErr) {
    console.error('❌ Database Setup/Migration Error:', migErr);
  }
  
  await initializeDefaultAccounts(conn);
  conn.release();
}).catch(err => {
  console.error('❌ Database Connection Error:', err);
});

// JWT Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Validate the current session and return the user profile
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT id, fullName, email, role, profilePic FROM users WHERE id = ?',
      [req.user.userId]
    );
    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    res.status(200).json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========================
// AUTHENTICATION ROUTES
// ========================

// Register Route (Student only)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const connection = await pool.getConnection();

    // Check if email already exists
    const [existingUser] = await connection.execute(
      'SELECT email FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Insert user (default role: student)
    await connection.execute(
      'INSERT INTO users (fullName, email, password, role) VALUES (?, ?, ?, ?)',
      [fullName, email, hashedPassword, 'student']
    );

    connection.release();
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login Route (Both Student and Admin)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const connection = await pool.getConnection();

    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    // Compare password
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      connection.release();
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // If admin, check if account is active
    if (user.role === 'admin') {
      const [adminData] = await connection.execute(
        'SELECT isActive FROM admin WHERE userId = ?',
        [user.id]
      );

      if (adminData.length === 0) {
        connection.release();
        return res.status(401).json({ message: 'Admin profile not found' });
      }

      if (!adminData[0].isActive) {
        connection.release();
        return res.status(401).json({ message: 'Your admin account is inactive. Contact system administrator.' });
      }
    }

    // Generate JWT Token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '7d' }
    );

    connection.release();
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========================
// ADMIN ROUTES
// ========================

// Assign Assignment to All Students
app.post('/api/admin/assignments', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create assignments' });
    }

    const { title, description, subject, dueDate } = req.body;

    if (!title || !subject || !dueDate) {
      return res.status(400).json({ message: 'Title, subject, and due date are required' });
    }

    const connection = await pool.getConnection();

    // Create assignment
    const [result] = await connection.execute(
      'INSERT INTO assignments (adminId, title, description, subject, dueDate, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.userId, title, description || null, subject, dueDate, 'active']
    );

    const assignmentId = result.insertId;

    // Get all students
    const [students] = await connection.execute(
      'SELECT id FROM users WHERE role = ?',
      ['student']
    );

    // Assign to all students
    for (const student of students) {
      await connection.execute(
        'INSERT INTO student_assignments (studentId, assignmentId, status) VALUES (?, ?, ?)',
        [student.id, assignmentId, 'pending']
      );

      // Create notification
      await connection.execute(
        'INSERT INTO notifications (studentId, assignmentId, message, type, isRead) VALUES (?, ?, ?, ?, ?)',
        [student.id, assignmentId, `New assignment: ${title} due on ${dueDate}`, 'new_assignment', false]
      );
    }

    connection.release();
    res.status(201).json({ 
      message: 'Assignment created and assigned to all students',
      assignmentId 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get All Assignments (Admin view)
app.get('/api/admin/assignments', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view this' });
    }

    const connection = await pool.getConnection();

    const [assignments] = await connection.execute(
      'SELECT a.*, COUNT(sa.id) as totalStudents, SUM(CASE WHEN sa.status = "submitted" THEN 1 ELSE 0 END) as submittedCount FROM assignments a LEFT JOIN student_assignments sa ON a.id = sa.assignmentId WHERE a.adminId = ? GROUP BY a.id ORDER BY a.dueDate DESC',
      [req.user.userId]
    );

    connection.release();
    res.status(200).json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========================
// STUDENT ROUTES
// ========================

// Get All Assignments for Student
app.get('/api/student/assignments', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can view this' });
    }

    const connection = await pool.getConnection();

    const [assignments] = await connection.execute(
      `SELECT a.*, sa.status, sa.submittedAt, sa.feedback, sa.marks, sa.id as assignmentInstanceId
       FROM assignments a
       JOIN student_assignments sa ON a.id = sa.assignmentId
       WHERE sa.studentId = ? AND a.status = 'active'
       ORDER BY a.dueDate ASC`,
      [req.user.userId]
    );

    connection.release();
    res.status(200).json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit Assignment
app.post('/api/student/submit-assignment', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit' });
    }

    const { assignmentId, submissionFile, fileData } = req.body;

    if (!assignmentId || !submissionFile) {
      return res.status(400).json({ message: 'Assignment ID and submission file name are required' });
    }

    let finalFileName = submissionFile;

    // If fileData (Base64) is provided, save it to the uploads directory (local backup)
    if (fileData) {
      try {
        const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const fileBuffer = Buffer.from(matches[2], 'base64');
          const timestamp = Date.now();
          // Clean filename to prevent directory traversal
          const safeFileName = submissionFile.replace(/[^a-zA-Z0-9.-]/g, '_');
          finalFileName = `${timestamp}-${safeFileName}`;
          
          const filePath = path.join(uploadsDir, finalFileName);
          await fs.promises.writeFile(filePath, fileBuffer);
        }
      } catch (err) {
        console.error('Error saving uploaded file locally:', err);
      }
    }

    const connection = await pool.getConnection();

    await connection.execute(
      'UPDATE student_assignments SET status = ?, submissionFile = ?, submissionFileData = ?, submittedAt = NOW() WHERE studentId = ? AND assignmentId = ?',
      ['submitted', finalFileName, fileData || null, req.user.userId, assignmentId]
    );

    connection.release();
    res.status(200).json({ message: 'Assignment submitted successfully', file: finalFileName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Notifications for Student
app.get('/api/student/notifications', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can view this' });
    }

    const connection = await pool.getConnection();

    const [notifications] = await connection.execute(
      `SELECT n.*, a.title, a.dueDate FROM notifications n
       JOIN assignments a ON n.assignmentId = a.id
       WHERE n.studentId = ?
       ORDER BY n.createdAt DESC`,
      [req.user.userId]
    );

    connection.release();
    res.status(200).json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark Notification as Read
app.put('/api/student/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can do this' });
    }

    const connection = await pool.getConnection();

    await connection.execute(
      'UPDATE notifications SET isRead = true WHERE id = ? AND studentId = ?',
      [req.params.id, req.user.userId]
    );

    connection.release();
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Student Profile/Password
app.put('/api/student/profile', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can update profile' });
    }

    const { fullName, currentPassword, newPassword, profilePicData, profilePicName, removeProfilePic } = req.body;
    const connection = await pool.getConnection();

    // Get current profilePic to clean up old files
    const [currentUserRows] = await connection.execute(
      'SELECT profilePic FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (currentUserRows.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'User not found' });
    }
    const oldProfilePic = currentUserRows[0].profilePic;

    let newProfilePicPath = undefined;
    let didUpdateProfilePic = false;

    // Handle profile picture upload (directly store base64 data in database)
    if (profilePicData && profilePicName) {
      newProfilePicPath = profilePicData;
      didUpdateProfilePic = true;
      
      // Also write local file backup (non-fatal if fails)
      try {
        const matches = profilePicData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const fileBuffer = Buffer.from(matches[2], 'base64');
          const safeFileName = profilePicName.replace(/[^a-zA-Z0-9.-]/g, '_');
          const localFileName = `avatar-${req.user.userId}-${safeFileName}`;
          const filePath = path.join(uploadsDir, localFileName);
          await fs.promises.writeFile(filePath, fileBuffer);
        }
      } catch (err) {
        console.error('Local backup profile picture save error (non-fatal):', err);
      }
    } else if (removeProfilePic) {
      newProfilePicPath = null;
      didUpdateProfilePic = true;
    }

    // Clean up old profile picture file if it was a physical file on disk
    if (didUpdateProfilePic && oldProfilePic && !oldProfilePic.startsWith('data:')) {
      try {
        const oldFilePath = path.join(uploadsDir, oldProfilePic);
        if (fs.existsSync(oldFilePath)) {
          await fs.promises.unlink(oldFilePath);
        }
      } catch (unlinkErr) {
        console.error('Error deleting old profile picture file:', unlinkErr);
      }
    }

    // Update password if requested
    if (currentPassword && newPassword) {
      const [users] = await connection.execute(
        'SELECT password FROM users WHERE id = ?',
        [req.user.userId]
      );

      const isPasswordValid = await bcryptjs.compare(currentPassword, users[0].password);
      if (!isPasswordValid) {
        connection.release();
        return res.status(400).json({ message: 'Invalid current password' });
      }

      const hashedNewPassword = await bcryptjs.hash(newPassword, 10);
      
      if (fullName) {
        if (didUpdateProfilePic) {
          await connection.execute(
            'UPDATE users SET fullName = ?, password = ?, profilePic = ? WHERE id = ?',
            [fullName, hashedNewPassword, newProfilePicPath, req.user.userId]
          );
        } else {
          await connection.execute(
            'UPDATE users SET fullName = ?, password = ? WHERE id = ?',
            [fullName, hashedNewPassword, req.user.userId]
          );
        }
      } else {
        if (didUpdateProfilePic) {
          await connection.execute(
            'UPDATE users SET password = ?, profilePic = ? WHERE id = ?',
            [hashedNewPassword, newProfilePicPath, req.user.userId]
          );
        } else {
          await connection.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedNewPassword, req.user.userId]
          );
        }
      }
    } else {
      if (fullName && didUpdateProfilePic) {
        await connection.execute(
          'UPDATE users SET fullName = ?, profilePic = ? WHERE id = ?',
          [fullName, newProfilePicPath, req.user.userId]
        );
      } else if (fullName) {
        await connection.execute(
          'UPDATE users SET fullName = ? WHERE id = ?',
          [fullName, req.user.userId]
        );
      } else if (didUpdateProfilePic) {
        await connection.execute(
          'UPDATE users SET profilePic = ? WHERE id = ?',
          [newProfilePicPath, req.user.userId]
        );
      } else {
        connection.release();
        return res.status(400).json({ message: 'Nothing to update' });
      }
    }

    // Get updated user details
    const [updatedUser] = await connection.execute(
      'SELECT id, fullName, email, role, profilePic FROM users WHERE id = ?',
      [req.user.userId]
    );

    connection.release();
    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========================
// ADMIN - VIEW STUDENT SUBMISSIONS
// ========================

app.get('/api/admin/assignments/:assignmentId/submissions', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view this' });
    }

    const connection = await pool.getConnection();

    const [submissions] = await connection.execute(
      `SELECT sa.*, u.fullName, u.email 
       FROM student_assignments sa
       JOIN users u ON sa.studentId = u.id
       JOIN assignments a ON sa.assignmentId = a.id
       WHERE a.id = ? AND a.adminId = ?
       ORDER BY sa.submittedAt DESC`,
      [req.params.assignmentId, req.user.userId]
    );

    connection.release();
    res.status(200).json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Admin Profile
app.get('/api/admin/profile', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const connection = await pool.getConnection();
    const [adminDetails] = await connection.execute(
      `SELECT u.id, u.fullName, u.email, u.role, u.profilePic, a.department, a.designation, a.phone, a.qualifications, a.experience
       FROM users u
       LEFT JOIN admin a ON u.id = a.userId
       WHERE u.id = ?`,
      [req.user.userId]
    );

    connection.release();
    if (adminDetails.length === 0) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    res.status(200).json(adminDetails[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Admin Profile/Password
app.put('/api/admin/profile', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update admin profile' });
    }

    const { fullName, department, designation, phone, qualifications, experience, currentPassword, newPassword, profilePicData, profilePicName, removeProfilePic } = req.body;
    const connection = await pool.getConnection();

    // Get current profilePic to clean up old files
    const [currentAdminRows] = await connection.execute(
      'SELECT profilePic FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (currentAdminRows.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'User not found' });
    }
    const oldProfilePic = currentAdminRows[0].profilePic;

    let newProfilePicPath = undefined;
    let didUpdateProfilePic = false;

    // Handle profile picture upload (directly store base64 data in database)
    if (profilePicData && profilePicName) {
      newProfilePicPath = profilePicData;
      didUpdateProfilePic = true;
      
      // Also write local file backup (non-fatal if fails)
      try {
        const matches = profilePicData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const fileBuffer = Buffer.from(matches[2], 'base64');
          const safeFileName = profilePicName.replace(/[^a-zA-Z0-9.-]/g, '_');
          const localFileName = `avatar-${req.user.userId}-${safeFileName}`;
          const filePath = path.join(uploadsDir, localFileName);
          await fs.promises.writeFile(filePath, fileBuffer);
        }
      } catch (err) {
        console.error('Local backup profile picture save error (non-fatal):', err);
      }
    } else if (removeProfilePic) {
      newProfilePicPath = null;
      didUpdateProfilePic = true;
    }

    // Clean up old profile picture file if it was a physical file on disk
    if (didUpdateProfilePic && oldProfilePic && !oldProfilePic.startsWith('data:')) {
      try {
        const oldFilePath = path.join(uploadsDir, oldProfilePic);
        if (fs.existsSync(oldFilePath)) {
          await fs.promises.unlink(oldFilePath);
        }
      } catch (unlinkErr) {
        console.error('Error deleting old profile picture file:', unlinkErr);
      }
    }

    await connection.beginTransaction();

    // If changing password
    if (currentPassword && newPassword) {
      const [users] = await connection.execute(
        'SELECT password FROM users WHERE id = ?',
        [req.user.userId]
      );

      const isPasswordValid = await bcryptjs.compare(currentPassword, users[0].password);
      if (!isPasswordValid) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ message: 'Invalid current password' });
      }

      const hashedNewPassword = await bcryptjs.hash(newPassword, 10);
      
      if (fullName) {
        if (didUpdateProfilePic) {
          await connection.execute(
            'UPDATE users SET fullName = ?, password = ?, profilePic = ? WHERE id = ?',
            [fullName, hashedNewPassword, newProfilePicPath, req.user.userId]
          );
        } else {
          await connection.execute(
            'UPDATE users SET fullName = ?, password = ? WHERE id = ?',
            [fullName, hashedNewPassword, req.user.userId]
          );
        }
      } else {
        if (didUpdateProfilePic) {
          await connection.execute(
            'UPDATE users SET password = ?, profilePic = ? WHERE id = ?',
            [hashedNewPassword, newProfilePicPath, req.user.userId]
          );
        } else {
          await connection.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedNewPassword, req.user.userId]
          );
        }
      }
    } else {
      if (fullName) {
        if (didUpdateProfilePic) {
          await connection.execute(
            'UPDATE users SET fullName = ?, profilePic = ? WHERE id = ?',
            [fullName, newProfilePicPath, req.user.userId]
          );
        } else {
          await connection.execute(
            'UPDATE users SET fullName = ? WHERE id = ?',
            [fullName, req.user.userId]
          );
        }
      } else if (didUpdateProfilePic) {
        await connection.execute(
          'UPDATE users SET profilePic = ? WHERE id = ?',
          [newProfilePicPath, req.user.userId]
        );
      }
    }

    // Update admin table details
    await connection.execute(
      `UPDATE admin SET department = ?, designation = ?, phone = ?, 
       qualifications = ?, experience = ? WHERE userId = ?`,
      [
        department || 'General',
        designation || 'Teacher',
        phone || '',
        qualifications || '',
        experience || 0,
        req.user.userId
      ]
    );

    await connection.commit();

    // Fetch updated user and admin details
    const [updatedUser] = await connection.execute(
      `SELECT u.id, u.fullName, u.email, u.role, u.profilePic, a.department, a.designation, a.phone, a.qualifications, a.experience 
       FROM users u
       LEFT JOIN admin a ON u.id = a.userId
       WHERE u.id = ?`,
      [req.user.userId]
    );

    connection.release();
    res.status(200).json({
      message: 'Admin profile updated successfully',
      user: updatedUser[0]
    });
  } catch (error) {
    console.error(error);
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Grade Student Submission
app.put('/api/admin/submissions/:submissionId/grade', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can grade submissions' });
    }

    const { marks, feedback } = req.body;
    const { submissionId } = req.params;

    if (marks === undefined || marks === null) {
      return res.status(400).json({ message: 'Marks are required' });
    }

    const connection = await pool.getConnection();

    // Verify this submission belongs to an assignment created by this admin
    const [submissionDetails] = await connection.execute(
      `SELECT sa.id, sa.studentId, sa.assignmentId, a.title 
       FROM student_assignments sa
       JOIN assignments a ON sa.assignmentId = a.id
       WHERE sa.id = ? AND a.adminId = ?`,
      [submissionId, req.user.userId]
    );

    if (submissionDetails.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Submission not found or unauthorized' });
    }

    const submission = submissionDetails[0];

    // Update submission
    await connection.execute(
      `UPDATE student_assignments 
       SET status = 'completed', marks = ?, feedback = ? 
       WHERE id = ?`,
      [marks, feedback || null, submissionId]
    );

    // Create notification for the student
    await connection.execute(
      `INSERT INTO notifications (studentId, assignmentId, message, type, isRead) 
       VALUES (?, ?, ?, 'submission_feedback', false)`,
      [
        submission.studentId,
        submission.assignmentId,
        `Your submission for "${submission.title}" has been graded: ${marks}/100. Feedback: ${feedback || 'None'}`,
      ]
    );

    connection.release();
    res.status(200).json({ message: 'Submission graded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========================
// STUDENT MANAGEMENT ROUTES
// ========================

// List all Students
app.get('/api/admin/students', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const connection = await pool.getConnection();
    const [students] = await connection.execute(
      `SELECT id, fullName, email, createdAt FROM users WHERE role = 'student' ORDER BY createdAt DESC`
    );
    connection.release();
    res.status(200).json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset Student Password
app.put('/api/admin/students/:id/reset-password', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const studentId = req.params.id;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE id = ? AND role = "student"',
      [hashedPassword, studentId]
    );
    
    connection.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========================
// ADMIN MANAGEMENT ROUTES
// ========================

// List all Admins
app.get('/api/admin/list', verifyToken, async (req, res) => {
  try {
    // Only admins can view admin list
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const connection = await pool.getConnection();
    const [admins] = await connection.execute(
      `SELECT u.id, u.fullName, u.email, a.department, a.designation, 
              a.phone, a.qualifications, a.experience, a.isActive, a.createdAt
       FROM users u
       LEFT JOIN admin a ON u.id = a.userId
       WHERE u.role = 'admin'
       ORDER BY u.createdAt DESC`
    );
    
    connection.release();
    res.status(200).json(admins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create New Admin
app.post('/api/admin/create', verifyToken, async (req, res) => {
  try {
    // Only admins can create admins
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { fullName, email, password, department, designation, phone, qualifications, experience } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const connection = await pool.getConnection();

    await connection.beginTransaction();

    // Insert into users table
    const [userResult] = await connection.execute(
      'INSERT INTO users (fullName, email, password, role) VALUES (?, ?, ?, ?)',
      [fullName, email, hashedPassword, 'admin']
    );

    const adminId = userResult.insertId;

    // Insert into admin table
    await connection.execute(
      'INSERT INTO admin (userId, department, designation, phone, qualifications, experience, isActive) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
      [adminId, department || 'General', designation || 'Teacher', phone || '', qualifications || '', experience || 0]
    );

    await connection.commit();
    connection.release();

    res.status(201).json({
      message: 'Admin created successfully',
      adminId: adminId,
      fullName,
      email
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Admin Details
app.put('/api/admin/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { department, designation, phone, qualifications, experience } = req.body;
    const connection = await pool.getConnection();

    await connection.execute(
      `UPDATE admin SET department = ?, designation = ?, phone = ?, 
       qualifications = ?, experience = ? WHERE userId = ?`,
      [department, designation, phone, qualifications, experience, req.params.id]
    );

    connection.release();
    res.status(200).json({ message: 'Admin updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Deactivate Admin
app.delete('/api/admin/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const connection = await pool.getConnection();
    await connection.execute(
      'UPDATE admin SET isActive = FALSE WHERE userId = ?',
      [req.params.id]
    );
    
    connection.release();
    res.status(200).json({ message: 'Admin deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========================
// SERVER START
// ========================

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'NIET Assignment Tracker Backend API is running successfully!'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

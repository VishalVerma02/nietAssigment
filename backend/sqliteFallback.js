const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcryptjs = require('bcryptjs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'niet.sqlite');
let db = null;
let initialized = false;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(dbPath);
  }
  return db;
}

async function init() {
  if (initialized) return;
  const database = getDb();

  return new Promise((resolve, reject) => {
    database.serialize(async () => {
      try {
        // 1. Users Table
        database.run(`CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fullName TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'student',
          profilePic TEXT DEFAULT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 2. Admin Table
        database.run(`CREATE TABLE IF NOT EXISTS admin (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER UNIQUE NOT NULL,
          department TEXT,
          designation TEXT,
          phone TEXT,
          qualifications TEXT,
          experience INTEGER DEFAULT 0,
          isActive INTEGER DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 3. Assignments Table
        database.run(`CREATE TABLE IF NOT EXISTS assignments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          adminId INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          subject TEXT,
          dueDate DATETIME NOT NULL,
          status TEXT DEFAULT 'active',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 4. Student Assignments Table
        database.run(`CREATE TABLE IF NOT EXISTS student_assignments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          studentId INTEGER NOT NULL,
          assignmentId INTEGER NOT NULL,
          status TEXT DEFAULT 'pending',
          submissionFile TEXT,
          submissionFileData TEXT,
          submittedAt DATETIME,
          feedback TEXT,
          marks INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(studentId, assignmentId)
        )`);

        // 5. Notifications Table
        database.run(`CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          studentId INTEGER NOT NULL,
          assignmentId INTEGER NOT NULL,
          message TEXT NOT NULL,
          type TEXT DEFAULT 'new_assignment',
          isRead INTEGER DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 6. Contact Messages Table
        database.run(`CREATE TABLE IF NOT EXISTS contact_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Pre-seed accounts if empty
        const adminHash = await bcryptjs.hash('admin123', 10);
        const adminGmailHash = await bcryptjs.hash('admin@123', 10);
        const studentHash = await bcryptjs.hash('student123', 10);
        const premHash = await bcryptjs.hash('1234', 10);

        const defaultUsers = [
          { name: 'Admin User', email: 'admin@niet.com', pass: adminHash, role: 'admin' },
          { name: 'Admin User', email: 'admin@gmail.com', pass: adminGmailHash, role: 'admin' },
          { name: 'Raj Kumar', email: 'raj@niet.com', pass: studentHash, role: 'student' },
          { name: 'Priya Singh', email: 'priya@niet.com', pass: studentHash, role: 'student' },
          { name: 'Prem Kumar', email: 'prem@12gmail.com', pass: premHash, role: 'student' }
        ];

        for (const u of defaultUsers) {
          database.run(
            `INSERT OR IGNORE INTO users (fullName, email, password, role) VALUES (?, ?, ?, ?)`,
            [u.name, u.email, u.pass, u.role]
          );
        }

        // Pre-seed admin details
        database.run(
          `INSERT OR IGNORE INTO admin (userId, department, designation, phone, qualifications, experience, isActive)
           VALUES (1, 'Computer Science', 'Head of Department', '9876543210', 'B.Tech, M.Tech', 10, 1)`
        );
        database.run(
          `INSERT OR IGNORE INTO admin (userId, department, designation, phone, qualifications, experience, isActive)
           VALUES (2, 'Computer Science', 'Head of Department', '9876543210', 'B.Tech, M.Tech', 10, 1)`
        );

        // Pre-seed sample assignments
        database.run(
          `INSERT OR IGNORE INTO assignments (id, adminId, title, description, subject, dueDate, status)
           VALUES (1, 1, 'Data Structures Assignment', 'Implement linked list operations and binary search trees.', 'DSA', '2026-11-20 23:59:00', 'active')`
        );
        database.run(
          `INSERT OR IGNORE INTO assignments (id, adminId, title, description, subject, dueDate, status)
           VALUES (2, 1, 'Web Development Project', 'Build a responsive website using HTML, CSS, and JavaScript.', 'Web Dev', '2026-11-25 23:59:00', 'active')`
        );

        // Pre-seed student assignments for students (id: 3, 4, 5)
        for (const sId of [3, 4, 5]) {
          database.run(`INSERT OR IGNORE INTO student_assignments (studentId, assignmentId, status) VALUES (?, 1, 'pending')`, [sId]);
          database.run(`INSERT OR IGNORE INTO student_assignments (studentId, assignmentId, status) VALUES (?, 2, 'pending')`, [sId]);
        }

        initialized = true;
        console.log('✅ SQLite persistent fallback database initialized and verified!');
        resolve();
      } catch (err) {
        console.error('Error initializing SQLite fallback:', err);
        reject(err);
      }
    });
  });
}

// Convert MySQL syntax to SQLite syntax
function transformSql(sql) {
  let transformed = sql;

  // Replace NOW() with datetime('now')
  transformed = transformed.replace(/\bNOW\(\)/gi, "datetime('now')");

  // Handle SHOW TABLES LIKE 'users'
  if (/SHOW\s+TABLES\s+LIKE/i.test(transformed)) {
    transformed = "SELECT name FROM sqlite_master WHERE type='table' AND name='users'";
  }

  // Handle SHOW COLUMNS FROM table LIKE 'col'
  const colMatch = transformed.match(/SHOW\s+COLUMNS\s+FROM\s+([^\s]+)\s+LIKE\s+'([^']+)'/i);
  if (colMatch) {
    transformed = `PRAGMA table_info(${colMatch[1]})`;
  }

  return transformed;
}

// Execute query on SQLite with MySQL2-compatible return format [rows, fields]
function executeQuery(sql, params = []) {
  const database = getDb();
  const cleanedSql = transformSql(sql.trim());
  const isSelect = /^SELECT\b/i.test(cleanedSql) || /^PRAGMA\b/i.test(cleanedSql);

  return new Promise((resolve, reject) => {
    if (isSelect) {
      database.all(cleanedSql, params, (err, rows) => {
        if (err) return reject(err);
        
        // If query was SHOW COLUMNS emulation via PRAGMA
        if (/^PRAGMA\s+table_info/i.test(cleanedSql)) {
          const mapped = (rows || []).map(r => ({
            Field: r.name,
            Type: r.type,
            Null: r.notnull ? 'NO' : 'YES',
            Key: r.pk ? 'PRI' : '',
            Default: r.dflt_value,
            Extra: ''
          }));
          return resolve([mapped, []]);
        }

        resolve([rows || [], []]);
      });
    } else {
      database.run(cleanedSql, params, function(err) {
        if (err) return reject(err);
        resolve([{
          insertId: this.lastID,
          affectedRows: this.changes,
          changedRows: this.changes
        }, []]);
      });
    }
  });
}

function getConnection() {
  return {
    execute: (sql, params) => executeQuery(sql, params),
    query: (sql, params) => executeQuery(sql, params),
    release: () => {}
  };
}

module.exports = {
  init,
  getConnection,
  getDb
};

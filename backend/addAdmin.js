// Add New Admin/Teacher
// Usage: node addAdmin.js

const mysql = require('mysql2/promise');
const bcryptjs = require('bcryptjs');
const readline = require('readline');
const dotenv = require('dotenv');

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => {
  rl.question(prompt, resolve);
});

async function addAdmin() {
  try {
    console.log('\n📝 Add New Admin/Teacher\n');

    const fullName = await question('👤 Full Name: ');
    const email = await question('📧 Email: ');
    const password = await question('🔐 Password: ');
    const department = await question('🏢 Department (e.g., Computer Science): ');
    const designation = await question('💼 Designation (e.g., Assistant Professor): ');
    const phone = await question('📱 Phone Number: ');
    const qualifications = await question('🎓 Qualifications (e.g., B.Tech, M.Tech): ');
    const experience = await question('📅 Years of Experience: ');

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Connect to database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'niet_assignment_tracker'
    });

    // Start transaction
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
      [adminId, department, designation, phone, qualifications, parseInt(experience)]
    );

    // Commit transaction
    await connection.commit();
    await connection.end();

    console.log('\n✅ Admin Added Successfully!\n');
    console.log('📋 Details:');
    console.log(`  Name: ${fullName}`);
    console.log(`  Email: ${email}`);
    console.log(`  Department: ${department}`);
    console.log(`  Designation: ${designation}`);
    console.log(`\n✨ Admin can now login with email and password!\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

addAdmin();

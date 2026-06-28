// Test Login Credentials
const mysql = require('mysql2/promise');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

async function testLogin() {
  try {
    console.log('\n🔍 Testing Admin Credentials...\n');

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'niet_assignment_tracker'
    });

    // Check if admin exists
    const [users] = await connection.execute(
      'SELECT id, fullName, email, password, role FROM users WHERE email = ?',
      ['admin@gmail.com']
    );

    if (users.length === 0) {
      console.log('❌ Admin not found in database!');
      console.log('   Expected email: admin@gmail.com\n');
      await connection.end();
      return;
    }

    const admin = users[0];
    console.log('✅ Admin found:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Name: ${admin.fullName}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Hash: ${admin.password}\n`);

    // Test password comparison
    const testPassword = 'admin@123';
    const isValid = await bcryptjs.compare(testPassword, admin.password);

    console.log(`🔐 Testing password: "${testPassword}"`);
    console.log(`   Result: ${isValid ? '✅ CORRECT' : '❌ WRONG'}\n`);

    // List all users
    const [allUsers] = await connection.execute(
      'SELECT id, fullName, email, role FROM users'
    );

    console.log('📋 All Users in Database:');
    allUsers.forEach(u => {
      console.log(`   • ${u.fullName} (${u.email}) - Role: ${u.role}`);
    });

    await connection.end();
    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();

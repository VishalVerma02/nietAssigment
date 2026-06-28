// Quick Database Import Script
// Imports database.sql into MySQL

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function importDatabase() {
  try {
    console.log('\n📥 Importing Database...\n');

    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Create connection with multipleStatements enabled
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL\n');

    // First, drop and recreate database
    await connection.query('DROP DATABASE IF EXISTS niet_assignment_tracker');
    console.log('🗑️  Cleaned old database\n');

    // Split SQL statements and execute
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      if (statement) {
        await connection.query(statement);
      }
    }

    console.log('✅ Database imported successfully!\n');
    console.log('📊 Created/Updated:');
    console.log('  • Database: niet_assignment_tracker');
    console.log('  • Table: users');
    console.log('  • Table: admin');
    console.log('  • Table: assignments');
    console.log('  • Table: student_assignments');
    console.log('  • Table: notifications');
    console.log('\n✨ Sample Data Loaded:');
    console.log('  • Admin: admin@gmail.com / admin@123');
    console.log('  • Students: raj@niet.com, priya@niet.com');
    console.log('  • Assignments: 2 sample assignments\n');

    await connection.end();
    console.log('🎉 Ready to use!\n');

  } catch (error) {
    console.error('\n❌ Import Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure MySQL is running');
    console.error('2. Check .env file has correct DB credentials');
    console.error('3. Verify MySQL user "root" exists\n');
    process.exit(1);
  }
}

importDatabase();

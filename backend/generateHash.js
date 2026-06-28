// Quick Password Hasher - Run this to generate bcryptjs hashes
// Usage: node generateHash.js

const bcryptjs = require('bcryptjs');

// Generate hashes for admin and test students
const passwords = {
  'admin@123': 'Admin password',
  'student@123': 'Student password',
  'password123': 'Test password'
};

(async () => {
  console.log('\n🔐 Password Hashes for Database:\n');
  
  for (const [password, description] of Object.entries(passwords)) {
    const hash = await bcryptjs.hash(password, 10);
    console.log(`Password: ${password}`);
    console.log(`Description: ${description}`);
    console.log(`Hash: ${hash}\n`);
  }

  console.log('\n📝 Use these hashes in your database.sql file');
  console.log('Replace the password field in INSERT statement:\n');
  console.log("INSERT INTO users (fullName, email, password, role) VALUES");
  console.log("('Admin User', 'admin@gmail.com', '<paste_hash_here>', 'admin'),");
})();

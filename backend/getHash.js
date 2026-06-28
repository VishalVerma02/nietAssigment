// Generate Correct Password Hash
const bcryptjs = require('bcryptjs');

async function generateHash() {
  const password = 'admin@123';
  const hash = await bcryptjs.hash(password, 10);
  console.log('\n✨ Correct Hash for "admin@123":\n');
  console.log(hash);
  console.log('\n');
}

generateHash();

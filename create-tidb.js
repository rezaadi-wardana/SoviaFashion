const mysql = require('mysql2/promise');

async function createDB() {
  // Connect without specifying a database to create one
  const connection = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
    port: 4000,
    user: '4CbWzvT5RZusepQ.root',
    password: 'hkEl03xUN7iVvd6t',
    ssl: { rejectUnauthorized: true },
  });

  console.log('✅ Connected to TiDB Cloud');
  
  await connection.query('CREATE DATABASE IF NOT EXISTS sovia_fashion');
  console.log('✅ Database "sovia_fashion" created');
  
  await connection.end();
}

createDB().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

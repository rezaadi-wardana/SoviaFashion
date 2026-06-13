const fs = require('fs');
const mysql = require('mysql2/promise');

// Table name mapping: MariaDB lowercase -> Prisma PascalCase
const TABLE_MAP = {
  'account': 'Account',
  'cartitem': 'CartItem',
  'category': 'Category',
  'hero': 'Hero',
  'order': 'Order',
  'orderitem': 'OrderItem',
  'product': 'Product',
  'productvariant': 'ProductVariant',
  'session': 'Session',
  'storeprofile': 'StoreProfile',
  'tryonresult': 'TryOnResult',
  'user': 'User',
  'verificationtoken': 'VerificationToken',
};

async function importDB() {
  const DB_URL = 'mysql://4CbWzvT5RZusepQ.root:hkEl03xUN7iVvd6t@gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com:4000/sovia_fashion';

  const connection = await mysql.createConnection({
    uri: DB_URL,
    multipleStatements: true,
    ssl: { rejectUnauthorized: true },
  });

  console.log('✅ Connected to Railway MySQL');

  // Step 1: Clear existing data (keep tables created by Prisma)
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  const [tables] = await connection.query("SHOW TABLES");
  for (const row of tables) {
    const tableName = Object.values(row)[0];
    await connection.query(`TRUNCATE TABLE \`${tableName}\``);
    console.log(`🧹 Cleared: ${tableName}`);
  }
  console.log('');

  // Step 2: Read data-only SQL dump (with column names)
  let sql = fs.readFileSync('./db_data.sql', 'utf8');
  if (sql.charCodeAt(0) === 0xFEFF) sql = sql.slice(1);

  // Extract INSERT statements and fix table names
  const insertLines = sql.split('\n')
    .filter(line => line.trim().startsWith('INSERT INTO'))
    .map(line => {
      for (const [lower, proper] of Object.entries(TABLE_MAP)) {
        const regex = new RegExp('INSERT INTO `' + lower + '`', 'gi');
        line = line.replace(regex, 'INSERT INTO `' + proper + '`');
      }
      return line;
    });

  console.log(`📄 Found ${insertLines.length} INSERT statements`);

  // Step 3: Import data
  let success = 0;
  let errors = 0;

  for (const stmt of insertLines) {
    try {
      await connection.query(stmt);
      success++;
      process.stdout.write(`\r⏳ Imported ${success}/${insertLines.length}...`);
    } catch (err) {
      errors++;
      if (errors <= 5) {
        console.log(`\n⚠️  ${err.message.substring(0, 150)}`);
      }
    }
  }

  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  // Verify
  const [tablesAfter] = await connection.query("SHOW TABLES");
  console.log(`\n\n📊 Tables (${tablesAfter.length}):`);
  for (const row of tablesAfter) {
    const name = Object.values(row)[0];
    const [count] = await connection.query(`SELECT COUNT(*) as c FROM \`${name}\``);
    console.log(`   ${name}: ${count[0].c} rows`);
  }

  console.log(`\n✅ Done! ${success} succeeded, ${errors} errors`);
  await connection.end();
}

importDB().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});

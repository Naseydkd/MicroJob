const mysql = require('mysql2/promise');
const { hashPassword } = require('../src/utils/password');
require('dotenv').config({ path: '../../.env' });

async function createAdmin() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'microjob_local',
  });

  const email = process.argv[2] || 'admin@microjob.com';
  const password = process.argv[3] || 'Admin1234!';

  try {
    const [existing] = await pool.execute('SELECT id FROM microjob_users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log(`❌ Un compte avec l'email ${email} existe déjà.`);
      process.exit(1);
    }

    const hashedPassword = await hashPassword(password);
    const id = 'admin_' + Math.random().toString(36).slice(2, 10);

    await pool.execute(
      `INSERT INTO microjob_users (id, email, user_type, nom, created_at) VALUES (?, ?, 'admin', 'Admin', NOW())`,
      [id, email]
    );
    await pool.execute(
      `INSERT INTO microjob_auth (user_id, email, password_hash, created_at) VALUES (?, ?, ?, NOW())`,
      [id, email, hashedPassword]
    );

    console.log(`✅ Compte admin créé avec succès !`);
    console.log(`   Email    : ${email}`);
    console.log(`   Password : ${password}`);
    console.log(`   ID       : ${id}`);
  } catch (err) {
    console.error('Erreur:', err.message);
  } finally {
    await pool.end();
  }
}

createAdmin();

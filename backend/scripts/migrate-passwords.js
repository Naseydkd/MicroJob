const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../.env' });

const SALT_ROUNDS = 12;

async function migratePasswords() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'microjob_local',
  });

  try {
    console.log('🔄 Migration des mots de passe en cours...');

    const [users] = await pool.execute('SELECT user_id, password_hash FROM auth_users');

    let migrated = 0;
    let skipped = 0;

    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2b$)
      if (user.password_hash.startsWith('$2b$')) {
        skipped++;
        continue;
      }

      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(user.password_hash, SALT_ROUNDS);

      await pool.execute(
        'UPDATE auth_users SET password_hash = ? WHERE user_id = ?',
        [hashedPassword, user.user_id]
      );

      migrated++;
    }

    console.log(`✅ Migration terminée:`);
    console.log(`   - ${migrated} mots de passe migrés`);
    console.log(`   - ${skipped} mots de passe déjà hachés (ignorés)`);

    await pool.end();
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  }
}

migratePasswords();

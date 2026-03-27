const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../.env' });

const SALT_ROUNDS = 12;

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: node reset-password.js <email> <nouveau_mot_de_passe>');
    process.exit(1);
  }

  const isLocal = (process.env.DATABASE_URL || '').includes('127.0.0.1');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  try {
    console.log(`🔄 Réinitialisation du mot de passe pour ${email}...`);

    const { rows } = await pool.query(
      'SELECT user_id FROM microjob_auth WHERE LOWER(email) = $1',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await pool.query(
      'UPDATE microjob_auth SET password_hash = $1 WHERE LOWER(email) = $2',
      [hashedPassword, email.toLowerCase()]
    );

    console.log(`✅ Mot de passe réinitialisé pour ${email}`);
    console.log(`   Nouveau mot de passe: ${newPassword}`);
    await pool.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

resetPassword();

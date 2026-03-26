const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../.env' });

const SALT_ROUNDS = 12;

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: node reset-password.js <email> <nouveau_mot_de_passe>');
    console.error('Exemple: node reset-password.js jeune1@test.com Password123');
    process.exit(1);
  }

  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'microjob_local',
  });

  try {
    console.log(`🔄 Réinitialisation du mot de passe pour ${email}...`);

    // Vérifier que l'utilisateur existe
    const [users] = await pool.execute(
      'SELECT user_id FROM auth_users WHERE LOWER(email) = ?',
      [email.toLowerCase()]
    );

    if (users.length === 0) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      process.exit(1);
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Mettre à jour le mot de passe
    await pool.execute(
      'UPDATE auth_users SET password_hash = ? WHERE LOWER(email) = ?',
      [hashedPassword, email.toLowerCase()]
    );

    console.log(`✅ Mot de passe réinitialisé avec succès pour ${email}`);
    console.log(`   Nouveau mot de passe: ${newPassword}`);

    await pool.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

resetPassword();

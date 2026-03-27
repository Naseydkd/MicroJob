const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '../.env' });

const { hashPassword, verifyPassword, validatePasswordStrength } = require('./utils/password');
const { generateToken, authenticateToken, requireUserType, requireOwnership } = require('./middleware/auth');
const { loginLimiter, signupLimiter, apiLimiter } = require('./middleware/rateLimiter');
const { validateEmail, sanitizeInput, validatePhone, validateUrl } = require('./middleware/validation');
const { uploadIdentityDocument } = require('./middleware/upload');

const app = express();

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '../../uploads/identity-documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:8100',
    'http://192.168.13.15:8100',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(apiLimiter);

// Servir les fichiers uploadés (protégé)
app.use('/uploads', authenticateToken, express.static(path.join(__dirname, '../../uploads')));

// PostgreSQL pool (Supabase local ou cloud)
const isLocal = (process.env.DATABASE_URL || '').includes('127.0.0.1') || (process.env.DATABASE_URL || '').includes('localhost');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

// Wrapper pour compatibilité avec l'ancienne API mysql2
pool.execute = async function(sql, params = []) {
  let i = 0;
  const pgSql = sql
    .replace(/\?/g, () => `$${++i}`)
    .replace(/CURDATE\(\)/g, 'CURRENT_DATE')
    .replace(/IF\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, 'CASE WHEN $1 THEN $2 ELSE $3 END');
  const result = await pool.query(pgSql, params);
  return [result.rows, result.fields];
};

pool.getConnection = async function() {
  const client = await pool.connect();
  client.execute = async function(sql, params = []) {
    let i = 0;
    const pgSql = sql
      .replace(/\?/g, () => `$${++i}`)
      .replace(/CURDATE\(\)/g, 'CURRENT_DATE')
      .replace(/IF\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, 'CASE WHEN $1 THEN $2 ELSE $3 END');
    const result = await client.query(pgSql, params);
    return [result.rows, result.fields];
  };
  client.beginTransaction = async () => client.query('BEGIN');
  client.commit = async () => client.query('COMMIT');
  client.rollback = async () => { try { await client.query('ROLLBACK'); } catch(e) {} };
  const orig = client.release.bind(client);
  client.release = () => orig();
  return client;
};

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function defaultNameFromEmail(email) {
  const [name] = String(email || '').split('@');
  return name || 'Utilisateur';
}

function newId(prefix) {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapMissionRow(row) {
  return {
    id: row.id,
    entrepriseId: row.entreprise_id,
    entrepriseNom: row.entreprise_nom,
    titre: row.titre,
    description: row.description,
    competencesRequises: parseJsonArray(row.competences_requises),
    remuneration: Number(row.remuneration || 0),
    duree: row.duree,
    dateDebut: row.date_debut,
    dateFin: row.date_fin,
    lieu: row.lieu,
    nombrePostes: row.nombre_postes,
    maxCandidatures: Number(row.max_candidatures || row.nombre_postes || 1),
    statut: mapMissionStatusFromDb(row.statut),
    candidaturesCount: row.candidatures_count,
    createdAt: row.created_at,
  };
}

function mapCandidatureStatusToDb(status) {
  if (status === 'acceptée') return 'acceptee';
  if (status === 'refusée') return 'refusee';
  return 'en_attente';
}

function mapCandidatureStatusFromDb(status) {
  if (status === 'acceptee') return 'acceptée';
  if (status === 'refusee') return 'refusée';
  return 'en_attente';
}

function mapMissionStatusFromDb(status) {
  if (status === 'terminee') return 'terminée';
  if (status === 'annulee') return 'annulée';
  return status;
}

function mapMissionStatusToDb(status) {
  if (status === 'terminée') return 'terminee';
  if (status === 'annulée') return 'annulee';
  if (['ouverte', 'en_cours', 'terminee', 'annulee'].includes(status)) return status;
  return 'ouverte';
}

function mapCandidatureRow(row) {
  return {
    id: row.id,
    missionId: row.mission_id,
    jeuneId: row.jeune_id,
    jeuneNom: row.jeune_nom,
    jeunePrenom: row.jeune_prenom,
    jeunePhoto: row.jeune_photo,
    jeuneNote: row.jeune_note == null ? null : Number(row.jeune_note),
    lettreMotivation: row.lettre_motivation,
    statut: mapCandidatureStatusFromDb(row.statut),
    motifRefus: row.motif_refus || '',
    datePostulation: row.date_postulation,
    dateReponse: row.date_reponse,
  };
}

async function ensureOptionalColumns() {
  try {
    await pool.execute('ALTER TABLE candidatures ADD COLUMN IF NOT EXISTS motif_refus TEXT');
  } catch (error) {
    if (error && error.code !== '42701') {
      throw error;
    }
  }

  try {
    await pool.execute('ALTER TABLE missions ADD COLUMN IF NOT EXISTS max_candidatures INT NOT NULL DEFAULT 1');
  } catch (error) {
    if (error && error.code !== '42701') {
      throw error;
    }
  }

  await pool.execute('UPDATE missions SET max_candidatures = GREATEST(nombre_postes, 1) WHERE max_candidatures IS NULL OR max_candidatures < 1');
}

function mapNotificationRow(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    titre: row.titre,
    message: row.message,
    type: row.type,
    lu: Boolean(row.lu),
    created_at: row.created_at,
  };
}

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, mode: 'postgresql', database: 'supabase' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/auth/signup', signupLimiter, uploadIdentityDocument, async (req, res) => {
  const { email, password, userType, nom, prenom, nomEntreprise, telephone, ville } = req.body || {};

  if (!email || !password || !userType) {
    return res.status(400).json({ error: 'email, password and userType are required' });
  }
  if (!['jeune', 'entreprise'].includes(userType)) {
    return res.status(400).json({ error: 'userType must be jeune or entreprise' });
  }

  // Vérifier qu'une pièce d'identité a été uploadée
  if (!req.file) {
    return res.status(400).json({ error: 'La pièce d\'identité est obligatoire' });
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    // Supprimer le fichier uploadé en cas d'erreur
    return res.status(400).json({ error: passwordValidation.error });
  }

  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return res.status(400).json({ error: emailValidation.error });
  }

  // Validate phone
  const phoneValidation = validatePhone(telephone);
  if (!phoneValidation.valid) {
    return res.status(400).json({ error: phoneValidation.error });
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedNom = sanitizeInput(nom || '');
  const normalizedPrenom = sanitizeInput(prenom || '');
  const normalizedNomEntreprise = sanitizeInput(nomEntreprise || '');
  const normalizedTelephone = String(telephone || '').trim();
  const normalizedVille = sanitizeInput(ville || '');

  if (userType === 'jeune' && (!normalizedNom || !normalizedPrenom)) {
    return res.status(400).json({ error: 'Nom et prenom sont obligatoires pour un compte jeune' });
  }
  if (userType === 'entreprise' && !normalizedNomEntreprise) {
    return res.status(400).json({ error: 'Le nom de l entreprise est obligatoire' });
  }
  if (!normalizedTelephone || !normalizedVille) {
    return res.status(400).json({ error: 'Telephone et ville sont obligatoires' });
  }

  const nomToSave =
    userType === 'entreprise'
      ? normalizedNomEntreprise
      : normalizedNom || defaultNameFromEmail(normalizedEmail);
  const prenomToSave = userType === 'jeune' ? normalizedPrenom : null;

  // Upload vers Supabase Storage
  const { uploadToStorage } = require('./supabaseStorage');
  let identityDocumentPath;
  try {
    identityDocumentPath = await uploadToStorage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
  } catch (uploadError) {
    return res.status(500).json({ error: 'Erreur lors de l\'upload du document: ' + uploadError.message });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.execute(
      'SELECT user_id FROM microjob_auth WHERE LOWER(email) = ? LIMIT 1',
      [normalizedEmail]
    );
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ error: 'Un compte existe deja avec cet email' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    const userId = newId(userType);
    await conn.execute(
      `INSERT INTO microjob_users (id, email, user_type, nom, prenom, telephone, ville, identity_document_path, identity_verified, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE, NOW())`,
      [userId, normalizedEmail, userType, nomToSave, prenomToSave, normalizedTelephone, normalizedVille, identityDocumentPath]
    );
    await conn.execute(
      `INSERT INTO microjob_auth (user_id, email, password_hash, created_at)
       VALUES (?, ?, ?, NOW())`,
      [userId, normalizedEmail, passwordHash]
    );

    if (userType === 'jeune') {
      await conn.execute(
        `INSERT INTO jeune_profiles (user_id)
         VALUES (?)`,
        [userId]
      );
    } else {
      await conn.execute(
        `INSERT INTO entreprise_profiles (user_id, nom_entreprise)
         VALUES (?, ?)`,
        [userId, normalizedNomEntreprise]
      );
    }

    await conn.commit();

    // Generate JWT token
    const token = generateToken(userId, userType);

    return res.status(201).json({
      userId,
      email: normalizedEmail,
      userType,
      nom: nomToSave,
      prenom: prenomToSave,
      telephone: normalizedTelephone,
      ville: normalizedVille,
      identityVerified: false,
      accessToken: token,
    });
  } catch (error) {
    try {
      await conn.rollback();
    } catch {}
    return res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

// Refresh token - renouvelle le token avec les données à jour
app.post('/auth/refresh', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, email, user_type, nom, prenom, telephone, ville, admin_role FROM microjob_users WHERE id = ? LIMIT 1`,
      [req.user.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const user = rows[0];
    const token = generateToken(user.id, user.user_type, user.admin_role);
    return res.json({
      userId: user.id,
      email: user.email,
      userType: user.user_type,
      adminRole: user.admin_role || null,
      nom: user.nom,
      accessToken: token,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/auth/login', loginLimiter, async (req, res) => {
  const { email, password, userType } = req.body || {};
  if (!email || !password || !userType) {
    return res.status(400).json({ error: 'email, password and userType are required' });
  }

  const normalizedEmail = normalizeEmail(email);
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.email, u.user_type, u.nom, u.prenom, u.telephone, u.ville, u.admin_role, au.password_hash
       FROM microjob_auth au
       JOIN microjob_users u ON u.id = au.user_id
       WHERE LOWER(au.email) = ?
       LIMIT 1`,
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const user = rows[0];

    // Verify password with bcrypt
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    if (user.user_type !== userType) {
      return res.status(403).json({
        code: 'WRONG_USER_TYPE',
        error: `Ce compte est un compte ${user.user_type}. Changez d'onglet pour vous connecter.`,
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.user_type, user.admin_role);

    return res.json({
      userId: user.id,
      email: user.email,
      userType: user.user_type,
      adminRole: user.admin_role || null,
      nom: user.nom,
      prenom: user.prenom,
      telephone: user.telephone,
      ville: user.ville,
      accessToken: token,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/users/:id', authenticateToken, requireOwnership('id'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, email, user_type, nom, prenom, telephone, ville, identity_verified
       FROM microjob_users
       WHERE id = ?
       LIMIT 1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    const user = rows[0];
    return res.json({
      userId: user.id,
      email: user.email,
      userType: user.user_type,
      nom: user.nom,
      prenom: user.prenom,
      telephone: user.telephone,
      ville: user.ville,
      identityVerified: Boolean(user.identity_verified),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch('/users/:id', authenticateToken, requireOwnership('id'), async (req, res) => {
  const { id } = req.params;
  const payload = req.body || {};
  const email = normalizeEmail(payload.email);
  const nom = String(payload.nom || '').trim();
  const prenom = payload.prenom == null ? null : String(payload.prenom).trim();
  const telephone = String(payload.telephone || '').trim();
  const ville = String(payload.ville || '').trim();

  if (!email || !nom || !telephone || !ville) {
    return res.status(400).json({ error: 'email, nom, telephone et ville sont obligatoires' });
  }

  try {
    const [userRows] = await pool.execute('SELECT * FROM microjob_users WHERE id = ? LIMIT 1', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const currentUser = userRows[0];
    if (currentUser.user_type === 'jeune' && !prenom) {
      return res.status(400).json({ error: 'prenom est obligatoire pour un compte jeune' });
    }

    const [existingEmailRows] = await pool.execute(
      'SELECT id FROM microjob_users WHERE LOWER(email) = ? AND id <> ? LIMIT 1',
      [email, id]
    );
    if (existingEmailRows.length > 0) {
      return res.status(409).json({ error: 'Un compte existe deja avec cet email' });
    }

    await pool.execute(
      `UPDATE microjob_users
       SET email = ?, nom = ?, prenom = ?, telephone = ?, ville = ?
       WHERE id = ?`,
      [email, nom, currentUser.user_type === 'jeune' ? prenom : null, telephone, ville, id]
    );

    await pool.execute('UPDATE microjob_auth SET email = ? WHERE user_id = ?', [email, id]);

    const [updatedRows] = await pool.execute(
      `SELECT id, email, user_type, nom, prenom, telephone, ville
       FROM microjob_users WHERE id = ? LIMIT 1`,
      [id]
    );

    const updated = updatedRows[0];
    return res.json({
      userId: updated.id,
      email: updated.email,
      userType: updated.user_type,
      nom: updated.nom,
      prenom: updated.prenom,
      telephone: updated.telephone,
      ville: updated.ville,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/entreprise-profiles/:userId', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ep.*, u.email, u.nom, u.telephone, u.ville
       FROM entreprise_profiles ep
       JOIN microjob_users u ON u.id = ep.user_id
       WHERE ep.user_id = ?
       LIMIT 1`,
      [req.params.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profil entreprise introuvable' });
    }
    const row = rows[0];
    return res.json({
      userId: row.user_id,
      nomEntreprise: row.nom_entreprise || '',
      secteurActivite: row.secteur_activite || '',
      description: row.description || '',
      adresse: row.adresse || '',
      siteWeb: row.site_web || '',
      notesMoyenne: Number(row.notes_moyenne || 0),
      nombreEvaluations: Number(row.nombre_evaluations || 0),
      missionsPubliees: Number(row.missions_publiees || 0),
      email: row.email || '',
      nom: row.nom || '',
      telephone: row.telephone || '',
      ville: row.ville || '',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch('/entreprise-profiles/:userId', authenticateToken, requireUserType('entreprise'), requireOwnership('userId'), async (req, res) => {
  const { userId } = req.params;
  const payload = req.body || {};

  const nomEntreprise = String(payload.nomEntreprise || '').trim();
  const secteurActivite = String(payload.secteurActivite || '').trim();
  const description = String(payload.description || '').trim();
  const adresse = String(payload.adresse || '').trim();
  const siteWeb = String(payload.siteWeb || '').trim();
  const email = normalizeEmail(payload.email);
  const telephone = String(payload.telephone || '').trim();
  const ville = String(payload.ville || '').trim();

  if (!nomEntreprise || !email || !telephone || !ville) {
    return res.status(400).json({ error: 'nomEntreprise, email, telephone et ville sont obligatoires' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [profileRows] = await conn.execute(
      `SELECT ep.user_id
       FROM entreprise_profiles ep
       JOIN microjob_users u ON u.id = ep.user_id
       WHERE ep.user_id = ? AND u.user_type = 'entreprise'
       LIMIT 1`,
      [userId]
    );
    if (profileRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Profil entreprise introuvable' });
    }

    const [existingEmailRows] = await conn.execute(
      'SELECT id FROM microjob_users WHERE LOWER(email) = ? AND id <> ? LIMIT 1',
      [email, userId]
    );
    if (existingEmailRows.length > 0) {
      await conn.rollback();
      return res.status(409).json({ error: 'Un compte existe deja avec cet email' });
    }

    await conn.execute(
      `UPDATE microjob_users
       SET email = ?, nom = ?, prenom = NULL, telephone = ?, ville = ?
       WHERE id = ?`,
      [email, nomEntreprise, telephone, ville, userId]
    );
    await conn.execute('UPDATE microjob_auth SET email = ? WHERE user_id = ?', [email, userId]);

    await conn.execute(
      `UPDATE entreprise_profiles
       SET nom_entreprise = ?, secteur_activite = ?, description = ?, adresse = ?, site_web = ?
       WHERE user_id = ?`,
      [nomEntreprise, secteurActivite, description, adresse, siteWeb, userId]
    );

    await conn.commit();
    const [rows] = await pool.execute(
      `SELECT ep.*, u.email, u.nom, u.telephone, u.ville
       FROM entreprise_profiles ep
       JOIN microjob_users u ON u.id = ep.user_id
       WHERE ep.user_id = ?
       LIMIT 1`,
      [userId]
    );
    const row = rows[0];
    return res.json({
      userId: row.user_id,
      nomEntreprise: row.nom_entreprise || '',
      secteurActivite: row.secteur_activite || '',
      description: row.description || '',
      adresse: row.adresse || '',
      siteWeb: row.site_web || '',
      notesMoyenne: Number(row.notes_moyenne || 0),
      nombreEvaluations: Number(row.nombre_evaluations || 0),
      missionsPubliees: Number(row.missions_publiees || 0),
      email: row.email || '',
      nom: row.nom || '',
      telephone: row.telephone || '',
      ville: row.ville || '',
    });
  } catch (error) {
    try {
      await conn.rollback();
    } catch {}
    return res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

app.get('/jeune-profiles/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT user_id, date_naissance, age, competences, experience, education, notes_moyenne, nombre_evaluations, missions_completees
       FROM jeune_profiles
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profil jeune introuvable' });
    }

    const profile = rows[0];
    return res.json({
      userId: profile.user_id,
      dateNaissance: profile.date_naissance,
      age: profile.age,
      competences: parseJsonArray(profile.competences),
      experience: profile.experience || '',
      education: profile.education || '',
      notesMoyenne: Number(profile.notes_moyenne || 0),
      nombreEvaluations: Number(profile.nombre_evaluations || 0),
      missionsCompletees: Number(profile.missions_completees || 0),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch('/jeune-profiles/:userId', authenticateToken, requireUserType('jeune'), requireOwnership('userId'), async (req, res) => {
  const { userId } = req.params;
  const payload = req.body || {};
  const education = String(payload.education || '').trim();
  const experience = String(payload.experience || '').trim();
  const competences = Array.isArray(payload.competences)
    ? payload.competences.map((c) => String(c).trim()).filter(Boolean)
    : [];

  try {
    const [rows] = await pool.execute(
      'SELECT user_id FROM jeune_profiles WHERE user_id = ? LIMIT 1',
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profil jeune introuvable' });
    }

    await pool.execute(
      `UPDATE jeune_profiles
       SET education = ?, experience = ?, competences = ?
       WHERE user_id = ?`,
      [education, experience, JSON.stringify(competences), userId]
    );

    const [updatedRows] = await pool.execute(
      `SELECT user_id, date_naissance, age, competences, experience, education, notes_moyenne, nombre_evaluations, missions_completees
       FROM jeune_profiles
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );
    const updated = updatedRows[0];

    return res.json({
      userId: updated.user_id,
      dateNaissance: updated.date_naissance,
      age: updated.age,
      competences: parseJsonArray(updated.competences),
      experience: updated.experience || '',
      education: updated.education || '',
      notesMoyenne: Number(updated.notes_moyenne || 0),
      nombreEvaluations: Number(updated.nombre_evaluations || 0),
      missionsCompletees: Number(updated.missions_completees || 0),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/stats/public', async (req, res) => {
  try {
    const [[usersStats]] = await pool.execute(
      `SELECT
        SUM(CASE WHEN user_type = 'jeune' THEN 1 ELSE 0 END) AS jeunes_inscrits,
        SUM(CASE WHEN user_type = 'entreprise' THEN 1 ELSE 0 END) AS entreprises_actives
       FROM microjob_users`
    );
    const [[missionsStats]] = await pool.execute(
      `SELECT COALESCE(SUM(missions_completees), 0) AS missions_realisees FROM jeune_profiles`
    );
    const [[evaluationStats]] = await pool.execute(
      `SELECT AVG(note) AS satisfaction_moyenne FROM evaluations`
    );

    return res.json({
      jeunesInscrits: Number(usersStats.jeunes_inscrits || 0),
      entreprisesActives: Number(usersStats.entreprises_actives || 0),
      missionsRealisees: Number(missionsStats.missions_realisees || 0),
      satisfactionMoyenne: Number(evaluationStats.satisfaction_moyenne || 0),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/missions', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM missions ORDER BY created_at DESC');
    res.json(rows.map(mapMissionRow));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/missions/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM missions WHERE id = ? LIMIT 1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Mission not found' });
    res.json(mapMissionRow(rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/missions', authenticateToken, requireUserType('entreprise'), async (req, res) => {
  const payload = req.body || {};
  const id = payload.id || newId('m');
  const entrepriseId = payload.entrepriseId || payload.entreprise_id;
  const titre = String(payload.titre || '').trim();
  const description = String(payload.description || '').trim() || null;
  const competencesRequises = Array.isArray(payload.competencesRequises)
    ? payload.competencesRequises
    : Array.isArray(payload.competences_requises)
      ? payload.competences_requises
      : [];
  const remuneration = Number(payload.remuneration);
  const duree = String(payload.duree || '').trim() || null;
  const dateDebut = payload.dateDebut || payload.date_debut || null;
  const dateFin = payload.dateFin || payload.date_fin || null;
  const lieu = String(payload.lieu || '').trim() || null;
  const nombrePostesRaw = Number(payload.nombrePostes ?? payload.nombre_postes ?? 1);
  const nombrePostes = Number.isFinite(nombrePostesRaw) && nombrePostesRaw > 0 ? Math.floor(nombrePostesRaw) : 1;
  const maxCandidaturesRaw = Number(
    payload.maxCandidatures ?? payload.max_candidatures ?? nombrePostes
  );
  const maxCandidatures =
    Number.isFinite(maxCandidaturesRaw) && maxCandidaturesRaw > 0
      ? Math.floor(maxCandidaturesRaw)
      : nombrePostes;
  const statut = mapMissionStatusToDb(payload.statut || 'ouverte');

  if (!entrepriseId || !titre) {
    return res.status(400).json({ error: 'entrepriseId et titre sont obligatoires' });
  }
  if (!Number.isFinite(remuneration) || remuneration <= 0) {
    return res.status(400).json({ error: 'remuneration doit etre un nombre positif' });
  }
  if (!Array.isArray(competencesRequises) || competencesRequises.length === 0) {
    return res.status(400).json({ error: 'Au moins une competence est requise' });
  }
  if (maxCandidatures < nombrePostes) {
    return res.status(400).json({ error: 'maxCandidatures doit etre superieur ou egal au nombre de postes' });
  }

  try {
    const [entrepriseRows] = await pool.execute(
      `SELECT u.id, u.user_type, COALESCE(ep.nom_entreprise, u.nom) AS entreprise_nom
       FROM microjob_users u
       LEFT JOIN entreprise_profiles ep ON ep.user_id = u.id
       WHERE u.id = ?
       LIMIT 1`,
      [entrepriseId]
    );

    if (entrepriseRows.length === 0) {
      return res.status(404).json({ error: 'Entreprise introuvable' });
    }
    if (entrepriseRows[0].user_type !== 'entreprise') {
      return res.status(400).json({ error: 'Le compte fourni n est pas un compte entreprise' });
    }

    const entrepriseNom = entrepriseRows[0].entreprise_nom || 'Entreprise';

    await pool.execute(
      `INSERT INTO missions (
        id, entreprise_id, entreprise_nom, titre, description, competences_requises,
        remuneration, duree, date_debut, date_fin, lieu, nombre_postes, max_candidatures, statut, candidatures_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
      [
        id,
        entrepriseId,
        entrepriseNom,
        titre,
        description,
        JSON.stringify(competencesRequises),
        remuneration,
        duree,
        dateDebut,
        dateFin,
        lieu,
        nombrePostes,
        maxCandidatures,
        statut,
      ]
    );

    await pool.execute(
      `UPDATE entreprise_profiles
       SET missions_publiees = missions_publiees + 1
       WHERE user_id = ?`,
      [entrepriseId]
    );

    const [rows] = await pool.execute('SELECT * FROM missions WHERE id = ? LIMIT 1', [id]);
    return res.status(201).json(mapMissionRow(rows[0]));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch('/missions/:id', authenticateToken, requireUserType('entreprise'), async (req, res) => {
  const { id } = req.params;
  const payload = req.body || {};
  const statut = mapMissionStatusToDb(payload.statut || '');

  if (!['ouverte', 'en_cours', 'terminee', 'annulee'].includes(statut)) {
    return res.status(400).json({ error: 'statut invalide' });
  }

  try {
    const [existing] = await pool.execute('SELECT * FROM missions WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Mission introuvable' });
    }

    await pool.execute(
      `UPDATE missions
       SET statut = $1, date_fin = CASE WHEN $2 = 'terminee' THEN CURRENT_DATE ELSE date_fin END
       WHERE id = ?`,
      [statut, statut, id]
    );

    const [rows] = await pool.execute('SELECT * FROM missions WHERE id = ? LIMIT 1', [id]);
    return res.json(mapMissionRow(rows[0]));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/applications', authenticateToken, requireUserType('jeune'), async (req, res) => {
  const payload = req.body || {};
  const id = payload.id || newId('c');
  const missionId = payload.missionId || payload.mission_id;
  const jeuneId = payload.jeuneId || payload.jeune_id;
  const jeuneNom = payload.jeuneNom || payload.jeune_nom || null;
  const jeunePrenom = payload.jeunePrenom || payload.jeune_prenom || null;
  const jeuneNote = payload.jeuneNote ?? payload.jeune_note ?? null;
  const lettreMotivation = payload.lettreMotivation || payload.lettre_motivation || null;
  const statut = mapCandidatureStatusToDb(payload.statut || 'en_attente');

  if (!missionId || !jeuneId) {
    return res.status(400).json({ error: 'missionId and jeuneId are required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [missionRows] = await conn.execute(
      'SELECT id, statut, candidatures_count, max_candidatures FROM missions WHERE id = ? LIMIT 1',
      [missionId]
    );
    if (missionRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Mission introuvable' });
    }
    const mission = missionRows[0];
    if (mission.statut !== 'ouverte') {
      await conn.rollback();
      return res.status(400).json({ error: 'Cette mission n accepte plus de candidatures' });
    }
    const maxCandidatures = Number(mission.max_candidatures || 0);
    const candidaturesCount = Number(mission.candidatures_count || 0);
    if (candidaturesCount >= maxCandidatures) {
      await conn.rollback();
      return res.status(409).json({ error: 'Le nombre maximum de candidatures est atteint' });
    }

    const [existingRows] = await conn.execute(
      `SELECT id
       FROM candidatures
       WHERE mission_id = ? AND jeune_id = ? AND statut IN ('en_attente', 'acceptee')
       LIMIT 1`,
      [missionId, jeuneId]
    );
    if (existingRows.length > 0) {
      await conn.rollback();
      return res.status(409).json({ error: 'Vous avez deja postule a cette mission' });
    }

    await conn.execute(
      `INSERT INTO candidatures (
        id, mission_id, jeune_id, jeune_nom, jeune_prenom, jeune_note, lettre_motivation, statut, date_postulation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, missionId, jeuneId, jeuneNom, jeunePrenom, jeuneNote, lettreMotivation, statut]
    );

    await conn.execute(
      `UPDATE missions
       SET candidatures_count = candidatures_count + 1
       WHERE id = ?`,
      [missionId]
    );

    await conn.commit();
    const [rows] = await pool.execute('SELECT * FROM candidatures WHERE id = ? LIMIT 1', [id]);
    return res.status(201).json(mapCandidatureRow(rows[0]));
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

app.patch('/applications/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute('SELECT * FROM candidatures WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Application not found' });
    }

    const previousStatus = rows[0].statut;
    const nextStatus = updates.statut
      ? mapCandidatureStatusToDb(updates.statut)
      : previousStatus;
    const motifRefus = updates.motifRefus == null ? '' : String(updates.motifRefus).trim();
    if (nextStatus === 'refusee' && !motifRefus) {
      await conn.rollback();
      return res.status(400).json({ error: 'Le motif du refus est obligatoire' });
    }
    const nextMotifRefus = nextStatus === 'refusee' ? motifRefus : null;

    const isPreviousActive = previousStatus === 'en_attente' || previousStatus === 'acceptee';
    const isNextActive = nextStatus === 'en_attente' || nextStatus === 'acceptee';
    if (!isPreviousActive && isNextActive) {
      const [missionRows] = await conn.execute(
        'SELECT candidatures_count, max_candidatures FROM missions WHERE id = ? LIMIT 1',
        [rows[0].mission_id]
      );
      if (missionRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'Mission introuvable' });
      }
      const mission = missionRows[0];
      if (Number(mission.candidatures_count || 0) >= Number(mission.max_candidatures || 0)) {
        await conn.rollback();
        return res.status(409).json({ error: 'Le nombre maximum de candidatures est atteint' });
      }
      await conn.execute(
        'UPDATE missions SET candidatures_count = candidatures_count + 1 WHERE id = ?',
        [rows[0].mission_id]
      );
    } else if (isPreviousActive && !isNextActive) {
      await conn.execute(
        'UPDATE missions SET candidatures_count = GREATEST(candidatures_count - 1, 0) WHERE id = ?',
        [rows[0].mission_id]
      );
    }

    await conn.execute(
      `UPDATE candidatures
       SET statut = ?,
           motif_refus = ?,
           date_reponse = IF(? <> statut, NOW(), date_reponse)
       WHERE id = ?`,
      [nextStatus, nextMotifRefus, nextStatus, id]
    );

    await conn.commit();
    const [updated] = await pool.execute('SELECT * FROM candidatures WHERE id = ? LIMIT 1', [id]);
    return res.json(mapCandidatureRow(updated[0]));
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

app.post('/evaluations', authenticateToken, async (req, res) => {
  const payload = req.body || {};
  const id = payload.id || newId('e');
  const missionId = payload.missionId || payload.mission_id;
  const evaluateurId = payload.evaluateurId || payload.evaluateur_id;
  const evaluateurNom = payload.evaluateurNom || payload.evaluateur_nom || null;
  const evalueId = payload.evalueId || payload.evalue_id;
  const note = Number(payload.note);
  const commentaire = payload.commentaire == null ? null : String(payload.commentaire).trim();

  if (!missionId || !evaluateurId || !evalueId) {
    return res.status(400).json({ error: 'missionId, evaluateurId et evalueId sont obligatoires' });
  }
  if (!Number.isFinite(note) || note < 1 || note > 5) {
    return res.status(400).json({ error: 'note doit etre un nombre entre 1 et 5' });
  }

  try {
    await pool.execute(
      `INSERT INTO evaluations (
        id, mission_id, evaluateur_id, evaluateur_nom, evalue_id, note, commentaire, date_evaluation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, missionId, evaluateurId, evaluateurNom, evalueId, note, commentaire]
    );

    const [rows] = await pool.execute('SELECT * FROM evaluations WHERE id = ? LIMIT 1', [id]);
    return res.status(201).json({
      id: rows[0].id,
      missionId: rows[0].mission_id,
      evaluateurId: rows[0].evaluateur_id,
      evaluateurNom: rows[0].evaluateur_nom,
      evalueId: rows[0].evalue_id,
      note: Number(rows[0].note || 0),
      commentaire: rows[0].commentaire,
      dateEvaluation: rows[0].date_evaluation,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/notifications/:userId', authenticateToken, requireOwnership('userId'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.params.userId]
    );
    res.json(rows.map(mapNotificationRow));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/candidatures/jeune/:jeuneId', authenticateToken, requireOwnership('jeuneId'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM candidatures WHERE jeune_id = ? ORDER BY date_postulation DESC',
      [req.params.jeuneId]
    );
    res.json(rows.map(mapCandidatureRow));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/candidatures/entreprise/:entrepriseId', authenticateToken, requireOwnership('entrepriseId'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*
       FROM candidatures c
       JOIN missions m ON m.id = c.mission_id
       WHERE m.entreprise_id = ?
       ORDER BY c.date_postulation DESC`,
      [req.params.entrepriseId]
    );
    res.json(rows.map(mapCandidatureRow));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes admin
app.get('/admin/users', authenticateToken, requireUserType('admin'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, email, user_type, nom, prenom, telephone, ville, identity_verified, created_at
       FROM microjob_users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/admin/stats', authenticateToken, requireUserType('admin'), async (req, res) => {
  try {
    const [[{ total_users }]] = await pool.execute('SELECT COUNT(*) as total_users FROM microjob_users');
    const [[{ total_jeunes }]] = await pool.execute("SELECT COUNT(*) as total_jeunes FROM microjob_users WHERE user_type='jeune'");
    const [[{ total_entreprises }]] = await pool.execute("SELECT COUNT(*) as total_entreprises FROM microjob_users WHERE user_type='entreprise'");
    const [[{ total_missions }]] = await pool.execute('SELECT COUNT(*) as total_missions FROM missions');
    const [[{ missions_ouvertes }]] = await pool.execute("SELECT COUNT(*) as missions_ouvertes FROM missions WHERE statut='ouverte'");
    const [[{ pending_verifs }]] = await pool.execute("SELECT COUNT(*) as pending_verifs FROM microjob_users WHERE identity_verified=FALSE AND identity_document_path IS NOT NULL");
    res.json({ total_users, total_jeunes, total_entreprises, total_missions, missions_ouvertes, pending_verifs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Historique des vérifications (approuvées et rejetées)
app.get('/admin/verifications-history', authenticateToken, requireUserType('admin'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, email, user_type, nom, prenom, telephone, ville, 
              identity_verified, identity_verified_at, identity_verified_by,
              identity_document_path, created_at
       FROM microjob_users
       WHERE identity_verified = TRUE OR (identity_verified = FALSE AND identity_document_path IS NULL AND created_at < NOW() - INTERVAL '1 day')
       ORDER BY identity_verified_at DESC NULLS LAST
       LIMIT 100`
    );
    const { getSignedUrl } = require('./supabaseStorage');
    const result = await Promise.all(rows.map(async (row) => {
      let document_url = null;
      if (row.identity_document_path) {
        try { document_url = await getSignedUrl(row.identity_document_path, 3600); } catch {}
      }
      return { ...row, document_url, status: row.identity_verified ? 'approved' : 'rejected' };
    }));
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Routes de vérification d'identité (admin uniquement)
app.get('/admin/pending-verifications', authenticateToken, requireUserType('admin'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, email, user_type, nom, prenom, telephone, ville, identity_document_path, created_at
       FROM microjob_users
       WHERE identity_verified = FALSE AND identity_document_path IS NOT NULL
       ORDER BY created_at ASC`
    );
    // Générer des URLs signées pour chaque document
    const { getSignedUrl } = require('./supabaseStorage');
    const result = await Promise.all(rows.map(async (row) => {
      try {
        const signedUrl = await getSignedUrl(row.identity_document_path, 3600);
        return { ...row, document_url: signedUrl };
      } catch {
        return { ...row, document_url: null };
      }
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/verify-identity/:userId', authenticateToken, requireUserType('admin'), async (req, res) => {
  const { userId } = req.params;
  const { approved } = req.body;
  const adminId = req.user.userId;

  try {
    if (approved) {
      await pool.execute(
        `UPDATE microjob_users
         SET identity_verified = TRUE, identity_verified_at = NOW(), identity_verified_by = ?
         WHERE id = ?`,
        [adminId, userId]
      );
      res.json({ message: 'Identité vérifiée avec succès' });
    } else {
      // Rejeter la vérification - supprimer le document et réinitialiser
      const [rows] = await pool.execute('SELECT identity_document_path FROM microjob_users WHERE id = ?', [userId]);
      if (rows.length > 0 && rows[0].identity_document_path) {
        const filePath = path.join(__dirname, '../../', rows[0].identity_document_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      await pool.execute(
        `UPDATE microjob_users
         SET identity_document_path = NULL
         WHERE id = ?`,
        [userId]
      );
      res.json({ message: 'Vérification rejetée' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour obtenir le statut de vérification
app.get('/users/:id/verification-status', authenticateToken, requireOwnership('id'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT identity_verified, identity_verified_at, identity_document_path
       FROM microjob_users
       WHERE id = ?`,
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    
    res.json({
      identityVerified: Boolean(rows[0].identity_verified),
      identityVerifiedAt: rows[0].identity_verified_at,
      hasDocument: Boolean(rows[0].identity_document_path),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ROUTES ADMIN AVANCÉES ============

// Middleware de vérification du rôle admin
function requireAdminRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
    if (req.user.userType !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    if (roles.length > 0 && !roles.includes(req.user.adminRole)) {
      return res.status(403).json({ error: `Rôle requis: ${roles.join(' ou ')}` });
    }
    next();
  };
}

// Liste des admins
app.get('/admin/admins', authenticateToken, requireAdminRole('super_admin'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, email, nom, admin_role, created_at FROM microjob_users WHERE user_type = 'admin' ORDER BY created_at ASC`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Créer un admin (invitation)
app.post('/admin/admins', authenticateToken, requireAdminRole('super_admin'), async (req, res) => {
  const { email, nom, password, role } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: 'email, password et role requis' });
  if (!['super_admin', 'moderator', 'support'].includes(role)) return res.status(400).json({ error: 'Rôle invalide' });
  try {
    const [existing] = await pool.execute('SELECT id FROM microjob_users WHERE LOWER(email) = $1 LIMIT 1', [email.toLowerCase()]);
    if (existing.length > 0) return res.status(409).json({ error: 'Email déjà utilisé' });
    const id = newId('admin');
    const hash = await hashPassword(password);
    await pool.execute(
      `INSERT INTO microjob_users (id, email, user_type, nom, admin_role, created_at) VALUES ($1, $2, 'admin', $3, $4, NOW())`,
      [id, email.toLowerCase(), nom || 'Admin', role]
    );
    await pool.execute(
      `INSERT INTO microjob_auth (user_id, email, password_hash, created_at) VALUES ($1, $2, $3, NOW())`,
      [id, email.toLowerCase(), hash]
    );
    await pool.execute(
      `INSERT INTO admin_logs (id, admin_id, action, target_id, details, created_at) VALUES ($1, $2, 'create_admin', $3, $4, NOW())`,
      [newId('log'), req.user.userId, id, `Rôle: ${role}`]
    );
    res.status(201).json({ id, email, nom, role });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Modifier le rôle d'un admin
app.patch('/admin/admins/:adminId/role', authenticateToken, requireAdminRole('super_admin'), async (req, res) => {
  const { role } = req.body;
  if (!['super_admin', 'moderator', 'support'].includes(role)) return res.status(400).json({ error: 'Rôle invalide' });
  if (req.params.adminId === req.user.userId) return res.status(400).json({ error: 'Impossible de modifier son propre rôle' });
  try {
    await pool.execute(`UPDATE microjob_users SET admin_role = $1 WHERE id = $2 AND user_type = 'admin'`, [role, req.params.adminId]);
    await pool.execute(
      `INSERT INTO admin_logs (id, admin_id, action, target_id, details, created_at) VALUES ($1, $2, 'change_role', $3, $4, NOW())`,
      [newId('log'), req.user.userId, req.params.adminId, `Nouveau rôle: ${role}`]
    );
    res.json({ message: 'Rôle mis à jour' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Supprimer un admin
app.delete('/admin/admins/:adminId', authenticateToken, requireAdminRole('super_admin'), async (req, res) => {
  if (req.params.adminId === req.user.userId) return res.status(400).json({ error: 'Impossible de se supprimer soi-même' });
  try {
    await pool.execute(`DELETE FROM microjob_auth WHERE user_id = $1`, [req.params.adminId]);
    await pool.execute(`DELETE FROM microjob_users WHERE id = $1 AND user_type = 'admin'`, [req.params.adminId]);
    res.json({ message: 'Admin supprimé' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Bannir/débannir un utilisateur
app.patch('/admin/users/:userId/ban', authenticateToken, requireUserType('admin'), async (req, res) => {
  const { userId } = req.params;
  const { banned, reason } = req.body;
  try {
    await pool.execute(`UPDATE microjob_users SET banned = ?, ban_reason = ? WHERE id = ?`, [banned ? TRUE : FALSE, reason || null, userId]);
    await pool.execute(`INSERT INTO admin_logs (id, admin_id, action, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
      [newId('log'), req.user.userId, banned ? 'ban_user' : 'unban_user', userId, reason || '']);
    res.json({ message: banned ? 'Utilisateur banni' : 'Utilisateur débanni' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Supprimer une mission
app.delete('/admin/missions/:missionId', authenticateToken, requireUserType('admin'), async (req, res) => {
  const { missionId } = req.params;
  const { reason } = req.body;
  try {
    await pool.execute(`DELETE FROM missions WHERE id = ?`, [missionId]);
    await pool.execute(`INSERT INTO admin_logs (id, admin_id, action, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
      [newId('log'), req.user.userId, 'delete_mission', missionId, reason || '']);
    res.json({ message: 'Mission supprimée' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Suspendre/réactiver une mission
app.patch('/admin/missions/:missionId/suspend', authenticateToken, requireUserType('admin'), async (req, res) => {
  const { missionId } = req.params;
  const { suspended } = req.body;
  try {
    await pool.execute(`UPDATE missions SET statut = ? WHERE id = ?`, [suspended ? 'suspendue' : 'ouverte', missionId]);
    await pool.execute(`INSERT INTO admin_logs (id, admin_id, action, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
      [newId('log'), req.user.userId, suspended ? 'suspend_mission' : 'reactivate_mission', missionId, '']);
    res.json({ message: suspended ? 'Mission suspendue' : 'Mission réactivée' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Détail d'un utilisateur
app.get('/admin/users/:userId', authenticateToken, requireUserType('admin'), async (req, res) => {
  const { userId } = req.params;
  try {
    const [[user]] = await pool.execute(`SELECT id, email, user_type, nom, prenom, telephone, ville, identity_verified, banned, ban_reason, created_at FROM microjob_users WHERE id = ?`, [userId]);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const [candidatures] = await pool.execute(`SELECT c.*, m.titre as mission_titre FROM candidatures c LEFT JOIN missions m ON m.id = c.mission_id WHERE c.jeune_id = ? ORDER BY c.date_postulation DESC LIMIT 10`, [userId]);
    const [missions] = await pool.execute(`SELECT * FROM missions WHERE entreprise_id = ? ORDER BY created_at DESC LIMIT 10`, [userId]);
    res.json({ user, candidatures, missions });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Logs d'activité admin
app.get('/admin/logs', authenticateToken, requireUserType('admin'), async (req, res) => {
  try {
    const [rows] = await pool.execute(`SELECT l.*, u.nom, u.email FROM admin_logs l LEFT JOIN microjob_users u ON u.id = l.admin_id ORDER BY l.created_at DESC LIMIT 100`);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Signalements
app.get('/admin/reports', authenticateToken, requireUserType('admin'), async (req, res) => {
  try {
    const [rows] = await pool.execute(`SELECT r.*, u.nom as reporter_nom, u.email as reporter_email FROM reports r LEFT JOIN microjob_users u ON u.id = r.reporter_id ORDER BY r.created_at DESC`);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/admin/reports/:reportId', authenticateToken, requireUserType('admin'), async (req, res) => {
  const { status } = req.body;
  try {
    await pool.execute(`UPDATE reports SET status = ?, resolved_at = NOW(), resolved_by = ? WHERE id = ?`, [status, req.user.userId, req.params.reportId]);
    res.json({ message: 'Signalement mis à jour' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Stats avancées
app.get('/admin/stats/advanced', authenticateToken, requireUserType('admin'), async (req, res) => {
  try {
    const [[{ total_users }]] = await pool.execute(`SELECT COUNT(*) as total_users FROM microjob_users WHERE user_type != 'admin'`);
    const [[{ total_jeunes }]] = await pool.execute(`SELECT COUNT(*) as total_jeunes FROM microjob_users WHERE user_type='jeune'`);
    const [[{ total_entreprises }]] = await pool.execute(`SELECT COUNT(*) as total_entreprises FROM microjob_users WHERE user_type='entreprise'`);
    const [[{ total_missions }]] = await pool.execute(`SELECT COUNT(*) as total_missions FROM missions`);
    const [[{ missions_ouvertes }]] = await pool.execute(`SELECT COUNT(*) as missions_ouvertes FROM missions WHERE statut='ouverte'`);
    const [[{ missions_terminees }]] = await pool.execute(`SELECT COUNT(*) as missions_terminees FROM missions WHERE statut='terminée'`);
    const [[{ total_candidatures }]] = await pool.execute(`SELECT COUNT(*) as total_candidatures FROM candidatures`);
    const [[{ pending_verifs }]] = await pool.execute(`SELECT COUNT(*) as pending_verifs FROM microjob_users WHERE identity_verified=FALSE AND identity_document_path IS NOT NULL`);
    const [[{ banned_users }]] = await pool.execute(`SELECT COUNT(*) as banned_users FROM microjob_users WHERE banned=TRUE`);
    const [users_by_day] = await pool.execute(`SELECT DATE(created_at) as date, COUNT(*) as count FROM microjob_users WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY date`);
    const [missions_by_day] = await pool.execute(`SELECT DATE(created_at) as date, COUNT(*) as count FROM missions WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY date`);
    res.json({ total_users, total_jeunes, total_entreprises, total_missions, missions_ouvertes, missions_terminees, total_candidatures, pending_verifs, banned_users, users_by_day, missions_by_day });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

const port = process.env.PORT || 4000;
app.listen(port, async () => {
  try {
    await pool.query('SELECT 1');
    console.log(`Backend listening on port ${port} (PostgreSQL/Supabase mode)`);
  } catch (error) {
    console.error('Backend started but MySQL connection failed:', error.message);
  }
});

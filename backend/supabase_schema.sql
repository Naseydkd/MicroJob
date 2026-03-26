-- ============================================
-- MICROJOB - Schéma Supabase (PostgreSQL)
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(191) UNIQUE NOT NULL,
  user_type VARCHAR(20) CHECK (user_type IN ('jeune','entreprise','admin')) NOT NULL,
  nom VARCHAR(120) NOT NULL,
  prenom VARCHAR(120),
  telephone VARCHAR(40),
  ville VARCHAR(120),
  identity_document_path TEXT,
  identity_verified BOOLEAN DEFAULT FALSE,
  identity_verified_at TIMESTAMPTZ,
  identity_verified_by VARCHAR(64),
  banned BOOLEAN DEFAULT FALSE,
  ban_reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auth users (passwords)
CREATE TABLE IF NOT EXISTS auth_users (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(191) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jeune profiles
CREATE TABLE IF NOT EXISTS jeune_profiles (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  date_naissance DATE,
  age INT,
  competences JSONB DEFAULT '[]',
  experience TEXT,
  education TEXT,
  cv TEXT,
  photo TEXT,
  notes_moyenne DECIMAL(3,2),
  nombre_evaluations INT DEFAULT 0,
  missions_completees INT DEFAULT 0
);

-- Entreprise profiles
CREATE TABLE IF NOT EXISTS entreprise_profiles (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nom_entreprise VARCHAR(191),
  secteur_activite VARCHAR(191),
  description TEXT,
  adresse TEXT,
  site_web VARCHAR(255),
  logo TEXT,
  notes_moyenne DECIMAL(3,2),
  nombre_evaluations INT DEFAULT 0,
  missions_publiees INT DEFAULT 0
);

-- Missions
CREATE TABLE IF NOT EXISTS missions (
  id VARCHAR(64) PRIMARY KEY,
  entreprise_id VARCHAR(64) REFERENCES users(id) ON DELETE RESTRICT,
  entreprise_nom VARCHAR(191),
  titre VARCHAR(191) NOT NULL,
  description TEXT,
  competences_requises JSONB DEFAULT '[]',
  remuneration DECIMAL(12,2),
  duree VARCHAR(120),
  date_debut DATE,
  date_fin DATE,
  lieu VARCHAR(191),
  nombre_postes INT DEFAULT 1,
  max_candidatures INT DEFAULT 1,
  statut VARCHAR(20) DEFAULT 'ouverte',
  candidatures_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Candidatures
CREATE TABLE IF NOT EXISTS candidatures (
  id VARCHAR(64) PRIMARY KEY,
  mission_id VARCHAR(64) REFERENCES missions(id) ON DELETE CASCADE,
  jeune_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  jeune_nom VARCHAR(120),
  jeune_prenom VARCHAR(120),
  jeune_photo TEXT,
  jeune_note DECIMAL(3,2),
  lettre_motivation TEXT,
  statut VARCHAR(20) DEFAULT 'en_attente',
  date_postulation TIMESTAMPTZ DEFAULT NOW(),
  date_reponse TIMESTAMPTZ,
  motif_refus TEXT
);

-- Evaluations
CREATE TABLE IF NOT EXISTS evaluations (
  id VARCHAR(64) PRIMARY KEY,
  mission_id VARCHAR(64) REFERENCES missions(id) ON DELETE CASCADE,
  evaluateur_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  evaluateur_nom VARCHAR(191),
  evalue_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  note INT CHECK (note BETWEEN 1 AND 5),
  commentaire TEXT,
  date_evaluation TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  titre VARCHAR(191) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30),
  lu BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id VARCHAR(64) PRIMARY KEY,
  admin_id VARCHAR(64),
  action VARCHAR(64),
  target_id VARCHAR(64),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports / Signalements
CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(64) PRIMARY KEY,
  reporter_id VARCHAR(64),
  target_id VARCHAR(64),
  target_type VARCHAR(32),
  reason TEXT,
  status VARCHAR(32) DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for backend service role access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE jeune_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE entreprise_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE candidatures DISABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

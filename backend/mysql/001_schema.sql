CREATE DATABASE IF NOT EXISTS microjob_local
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE microjob_local;

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) NOT NULL,
  email VARCHAR(191) NOT NULL,
  user_type ENUM('jeune','entreprise','admin') NOT NULL,
  nom VARCHAR(120) NOT NULL,
  prenom VARCHAR(120) NULL,
  telephone VARCHAR(40) NULL,
  ville VARCHAR(120) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auth_users (
  user_id VARCHAR(64) NOT NULL,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_auth_users_email (email),
  CONSTRAINT fk_auth_users_user FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS jeune_profiles (
  user_id VARCHAR(64) NOT NULL,
  date_naissance DATE NULL,
  age INT NULL,
  competences JSON NULL,
  experience TEXT NULL,
  education TEXT NULL,
  cv TEXT NULL,
  photo TEXT NULL,
  notes_moyenne DECIMAL(3,2) NULL,
  nombre_evaluations INT NOT NULL DEFAULT 0,
  missions_completees INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_jeune_profiles_user FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS entreprise_profiles (
  user_id VARCHAR(64) NOT NULL,
  nom_entreprise VARCHAR(191) NULL,
  secteur_activite VARCHAR(191) NULL,
  description TEXT NULL,
  adresse TEXT NULL,
  site_web VARCHAR(255) NULL,
  logo TEXT NULL,
  notes_moyenne DECIMAL(3,2) NULL,
  nombre_evaluations INT NOT NULL DEFAULT 0,
  missions_publiees INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_entreprise_profiles_user FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS missions (
  id VARCHAR(64) NOT NULL,
  entreprise_id VARCHAR(64) NOT NULL,
  entreprise_nom VARCHAR(191) NULL,
  titre VARCHAR(191) NOT NULL,
  description TEXT NULL,
  competences_requises JSON NULL,
  remuneration DECIMAL(12,2) NULL,
  duree VARCHAR(120) NULL,
  date_debut DATE NULL,
  date_fin DATE NULL,
  lieu VARCHAR(191) NULL,
  nombre_postes INT NOT NULL DEFAULT 1,
  max_candidatures INT NOT NULL DEFAULT 1,
  statut ENUM('ouverte','en_cours','terminee','annulee') NOT NULL DEFAULT 'ouverte',
  candidatures_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_missions_entreprise (entreprise_id),
  KEY idx_missions_statut (statut),
  CONSTRAINT fk_missions_entreprise FOREIGN KEY (entreprise_id)
    REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS candidatures (
  id VARCHAR(64) NOT NULL,
  mission_id VARCHAR(64) NOT NULL,
  jeune_id VARCHAR(64) NOT NULL,
  jeune_nom VARCHAR(120) NULL,
  jeune_prenom VARCHAR(120) NULL,
  jeune_photo TEXT NULL,
  jeune_note DECIMAL(3,2) NULL,
  lettre_motivation TEXT NULL,
  statut ENUM('en_attente','acceptee','refusee') NOT NULL DEFAULT 'en_attente',
  date_postulation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_reponse DATETIME NULL,
  motif_refus TEXT NULL,
  PRIMARY KEY (id),
  KEY idx_candidatures_jeune (jeune_id),
  KEY idx_candidatures_mission (mission_id),
  CONSTRAINT fk_candidatures_mission FOREIGN KEY (mission_id)
    REFERENCES missions(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_candidatures_jeune FOREIGN KEY (jeune_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS evaluations (
  id VARCHAR(64) NOT NULL,
  mission_id VARCHAR(64) NOT NULL,
  evaluateur_id VARCHAR(64) NOT NULL,
  evaluateur_nom VARCHAR(191) NULL,
  evalue_id VARCHAR(64) NOT NULL,
  note INT NOT NULL,
  commentaire TEXT NULL,
  date_evaluation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_evaluations_mission (mission_id),
  KEY idx_evaluations_evalue (evalue_id),
  CONSTRAINT fk_evaluations_mission FOREIGN KEY (mission_id)
    REFERENCES missions(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_evaluations_evaluateur FOREIGN KEY (evaluateur_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_evaluations_evalue FOREIGN KEY (evalue_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT ck_evaluations_note CHECK (note BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  titre VARCHAR(191) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('candidature','acceptation','refus','evaluation','mission') NOT NULL,
  lu TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user (user_id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Ajout des colonnes pour la vérification d'identité
USE microjob_local;

-- Ajouter les colonnes à la table users
ALTER TABLE users 
ADD COLUMN identity_document_path VARCHAR(255) NULL AFTER ville,
ADD COLUMN identity_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER identity_document_path,
ADD COLUMN identity_verified_at DATETIME NULL AFTER identity_verified,
ADD COLUMN identity_verified_by VARCHAR(64) NULL AFTER identity_verified_at;

-- Index pour rechercher les utilisateurs non vérifiés
CREATE INDEX idx_users_identity_verified ON users(identity_verified);

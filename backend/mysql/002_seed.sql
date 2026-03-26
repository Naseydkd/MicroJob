-- cspell:disable
USE microjob_local;

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Nettoyage des données entreprise + missions existantes
DELETE c
FROM candidatures c
JOIN missions m ON m.id = c.mission_id
JOIN users u ON u.id = m.entreprise_id
WHERE u.user_type = 'entreprise';

DELETE FROM missions
WHERE entreprise_id IN (SELECT id FROM users WHERE user_type = 'entreprise');

DELETE FROM entreprise_profiles
WHERE user_id IN (SELECT id FROM users WHERE user_type = 'entreprise');

DELETE FROM auth_users
WHERE user_id IN (SELECT id FROM users WHERE user_type = 'entreprise');

DELETE FROM users
WHERE user_type = 'entreprise';

INSERT INTO users (id, email, user_type, nom, prenom, telephone, ville, created_at) VALUES
('jeune1','jeune1@test.com','jeune','Ibrahim','Moussa','+227 90 12 34 56','Niamey','2025-11-15 00:00:00'),
('jeune2','jeune2@test.com','jeune','Abdou','Aicha','+227 91 23 45 67','Niamey','2025-12-01 00:00:00')
ON DUPLICATE KEY UPDATE
  user_type = VALUES(user_type),
  nom = VALUES(nom),
  prenom = VALUES(prenom),
  telephone = VALUES(telephone),
  ville = VALUES(ville);

INSERT INTO auth_users (user_id, email, password_hash, created_at) VALUES
('jeune1','jeune1@test.com','password123','2025-11-15 00:00:00')
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash);

INSERT INTO jeune_profiles (user_id, date_naissance, age, competences, experience, education, notes_moyenne, nombre_evaluations, missions_completees) VALUES
('jeune1','2002-05-15',23,
 JSON_ARRAY('Informatique','Excel','Comptabilite','Service client','Francais','Haoussa','Zarma'),
 '2 ans d experience en saisie de donnees et service client',
 'Baccalaureat serie C + Formation en bureautique',
 4.60,8,8)
ON DUPLICATE KEY UPDATE
  age = VALUES(age),
  competences = VALUES(competences),
  experience = VALUES(experience),
  education = VALUES(education);

INSERT INTO notifications (id, user_id, titre, message, type, lu, created_at) VALUES
('n1','jeune1','Information','Pas de mission disponible pour l instant.','mission',0,'2026-02-23 14:30:00')
ON DUPLICATE KEY UPDATE
  titre = VALUES(titre),
  message = VALUES(message),
  type = VALUES(type),
  lu = VALUES(lu);

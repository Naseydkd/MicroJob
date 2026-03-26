-- cspell:disable
-- sample data for development (sans entreprises)

-- nettoyage des données entreprise + missions existantes
delete from candidatures
where mission_id in (
  select id from missions where entreprise_id in (select id from users where user_type = 'entreprise')
);
delete from missions where entreprise_id in (select id from users where user_type = 'entreprise');
delete from entreprise_profiles where user_id in (select id from users where user_type = 'entreprise');
delete from auth_users where user_id in (select id from users where user_type = 'entreprise');
delete from users where user_type = 'entreprise';

-- users
insert into users (id, email, user_type, nom, prenom, telephone, ville, created_at) values
('jeune1','jeune1@test.com','jeune','Ibrahim','Moussa','+227 90 12 34 56','Niamey','2025-11-15'),
('jeune2','jeune2@test.com','jeune','Abdou','Aïcha','+227 91 23 45 67','Niamey','2025-12-01');

-- profiles
insert into jeune_profiles (user_id, date_naissance, age, competences, experience, education, notes_moyenne, nombre_evaluations, missions_completees) values
('jeune1','2002-05-15',23,array['Informatique','Excel','Comptabilité','Service client','Français','Haoussa','Zarma'],'2 ans d''expérience en saisie de données et service client','Baccalauréat série C + Formation en bureautique',4.6,8,8);

-- notifications
insert into notifications (id,user_id,titre,message,type,lu,created_at) values
('n1','jeune1','Information','Pas de mission disponible pour l''instant.','mission',false,'2026-02-23T14:30:00');

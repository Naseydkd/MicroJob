# MySQL local (Microjob)

## 1) Creer la base et les tables
Depuis la racine du projet:

```bash
mysql -u root -p < backend/mysql/001_schema.sql
```

## 2) Inserer les donnees de test

```bash
mysql -u root -p < backend/mysql/002_seed.sql
```

## 3) Verifier rapidement

```bash
mysql -u root -p -e "USE microjob_local; SHOW TABLES;"
mysql -u root -p -e "USE microjob_local; SELECT id,email,user_type FROM users;"
```

## Tables creees
- users
- auth_users
- jeune_profiles
- entreprise_profiles
- missions
- candidatures
- evaluations
- notifications

## Notes
- `auth_users.password_hash` contient des mots de passe en clair pour le dev local uniquement.
- Pour la prod, il faut hasher (bcrypt/argon2).
- Le schema est pret pour transferer vers un serveur distant plus tard.

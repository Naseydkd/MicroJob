# 🔒 Guide de Sécurité - Application MicroJob

## Installation Rapide (5 minutes)

### 1. Installer les dépendances
```bash
cd backend
npm install
```

### 2. Créer le dossier uploads
```bash
mkdir -p uploads/identity-documents
```

### 3. Exécuter les migrations SQL
```bash
mysql -u root -p microjob_local < backend/mysql/003_identity_verification.sql
```

### 4. Générer le secret JWT
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Configurer .env
Ajoutez dans votre fichier `.env` :
```env
JWT_SECRET=<collez_le_secret_généré_ci-dessus>
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### 6. Migrer les mots de passe existants
```bash
cd backend
npm run migrate:passwords
```

### 7. Démarrer
```bash
npm start
```

## Sécurités Implémentées

- ✅ Hachage bcrypt des mots de passe (12 rounds)
- ✅ Authentification JWT avec expiration (7 jours)
- ✅ Rate limiting (5 tentatives login / 15 min)
- ✅ Validation des emails, téléphones, URLs
- ✅ Protection XSS (sanitization)
- ✅ Headers de sécurité (Helmet.js)
- ✅ CORS configuré
- ✅ 14 routes protégées par JWT
- ✅ Vérification d'identité avec upload de pièce d'identité

## Vérification d'Identité

### Fonctionnement
1. L'utilisateur upload sa pièce d'identité lors de l'inscription
2. Le document est stocké de manière sécurisée
3. Un admin vérifie et approuve/rejette le document
4. L'utilisateur reçoit une notification du résultat

### Formats acceptés
- Images : JPG, PNG
- Documents : PDF
- Taille max : 5MB

### Routes API
- `POST /auth/signup` - Inscription avec upload (multipart/form-data)
- `GET /users/:id/verification-status` - Statut de vérification
- `GET /admin/pending-verifications` - Liste des vérifications en attente (admin)
- `POST /admin/verify-identity/:userId` - Approuver/rejeter (admin)

## Utilisation Frontend

### Inscription avec pièce d'identité
```typescript
import { useAuth } from './lib/useAuth';
import { IdentityDocumentUpload } from './components/IdentityDocumentUpload';

function SignupForm() {
  const { signup } = useAuth();
  const [identityDocument, setIdentityDocument] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!identityDocument) {
      alert('Pièce d\'identité requise');
      return;
    }

    await signup({
      email,
      password,
      userType,
      nom,
      prenom,
      telephone,
      ville,
      identityDocument,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Autres champs */}
      <IdentityDocumentUpload onFileSelect={setIdentityDocument} />
      <button type="submit">S'inscrire</button>
    </form>
  );
}
```

### Afficher le statut de vérification
```typescript
import { VerificationStatus } from './components/VerificationStatus';

function Profile() {
  const user = getAuthUser();
  
  return (
    <div>
      <VerificationStatus userId={user.id} />
    </div>
  );
}
```

### Hook d'authentification
```typescript
import { useAuth } from './lib/useAuth';

function MyComponent() {
  const { user, login, logout } = useAuth();
  
  await login(email, password, userType);
  logout();
}
```

### Service API
```typescript
import { api } from './lib/api';

const missions = await api.get('/missions');
const result = await api.post('/applications', data);
```

### Protection des routes
```typescript
import { ProtectedRoute } from './components/ProtectedRoute';

<ProtectedRoute requiredUserType="jeune">
  <DashboardJeune />
</ProtectedRoute>
```

## Tests

```bash
# Tests de sécurité
./backend/tests/security.test.sh

# Audit npm
cd backend && npm audit
```

## Routes Protégées

Nécessitent un token JWT dans le header `Authorization: Bearer <token>` :
- GET/PATCH /users/:id
- GET/PATCH /jeune-profiles/:userId
- GET/PATCH /entreprise-profiles/:userId
- POST/PATCH /missions
- POST/PATCH /applications
- GET /candidatures/*
- GET /notifications/:userId
- POST /evaluations
- GET /users/:id/verification-status
- GET /admin/pending-verifications (admin uniquement)
- POST /admin/verify-identity/:userId (admin uniquement)

## Fichiers Créés

**Backend:**
- `backend/src/utils/password.js` - Gestion mots de passe
- `backend/src/middleware/auth.js` - Authentification JWT
- `backend/src/middleware/rateLimiter.js` - Rate limiting
- `backend/src/middleware/validation.js` - Validation
- `backend/src/middleware/upload.js` - Upload de fichiers
- `backend/scripts/migrate-passwords.js` - Migration
- `backend/tests/security.test.sh` - Tests
- `backend/mysql/003_identity_verification.sql` - Migration DB

**Frontend:**
- `src/app/lib/api.ts` - Service API
- `src/app/lib/useAuth.ts` - Hook auth
- `src/app/components/ProtectedRoute.tsx` - Protection routes
- `src/app/components/IdentityDocumentUpload.tsx` - Upload pièce d'identité
- `src/app/components/VerificationStatus.tsx` - Statut de vérification

## Structure des Dossiers

```
uploads/
└── identity-documents/     # Documents d'identité (protégé)
    ├── 1234567890-abc123.jpg
    └── 1234567891-def456.pdf
```

## Production

Avant de déployer :
- [ ] Générer un JWT_SECRET unique et fort
- [ ] Configurer HTTPS
- [ ] Configurer FRONTEND_URL avec le domaine de production
- [ ] Créer le dossier uploads avec les bonnes permissions
- [ ] Configurer un stockage cloud (S3, etc.) pour les fichiers
- [ ] Migrer les mots de passe
- [ ] Exécuter la migration SQL pour la vérification d'identité
- [ ] Tester toutes les fonctionnalités
- [ ] Exécuter les tests de sécurité
- [ ] Créer un compte admin pour la vérification des identités

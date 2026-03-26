const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PRODUCTION';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(userId, userType, adminRole = null) {
  return jwt.sign(
    { userId, userType, adminRole },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'authentification requis' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Token invalide ou expiré' });
  }

  req.user = decoded;
  next();
}

function requireUserType(...allowedTypes) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({ error: 'Accès non autorisé pour ce type de compte' });
    }
    next();
  };
}

function requireOwnership(userIdParam = 'id') {
  return (req, res, next) => {
    const targetUserId = req.params[userIdParam] || req.body.userId;
    if (req.user.userId !== targetUserId) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres données' });
    }
    next();
  };
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  requireUserType,
  requireOwnership,
  JWT_SECRET,
};

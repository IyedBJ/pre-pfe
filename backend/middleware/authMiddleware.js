const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_jwt");

      req.user = decoded;
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Non autorisé, token invalide' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Non autorisé, pas de token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Non autorisé, rôle administrateur requis' });
  }
};

const finance = (req, res, next) => {
  if (req.user && (req.user.role === 'finance' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Non autorisé, accès finance requis' });
  }
};

module.exports = { protect, admin, finance };

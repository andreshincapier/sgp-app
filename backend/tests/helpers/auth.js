const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sgp_jwt_secret_test';

function tokenAdmin(overrides = {}) {
  return jwt.sign(
    { id: 1, usuario: 'admin', nombre: 'Carlos García', rol: 'administrador', ...overrides },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function tokenSecretaria(overrides = {}) {
  return jwt.sign(
    { id: 2, usuario: 'secretaria', nombre: 'María López', rol: 'secretaria', ...overrides },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

module.exports = { tokenAdmin, tokenSecretaria, JWT_SECRET };

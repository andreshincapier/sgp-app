const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sgp_jwt_secret_2026_dev';

function verificarToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sesión expirada. Inicie sesión nuevamente' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesión expirada. Inicie sesión nuevamente' });
  }
}

function soloAdmin(req, res, next) {
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ error: 'No tiene permisos para realizar esta acción' });
  }
  next();
}

module.exports = { verificarToken, soloAdmin };

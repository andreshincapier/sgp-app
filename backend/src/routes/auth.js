const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sgp_jwt_secret_2026_dev';

router.post('/login', async (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM empleado WHERE usuario = $1',
      [usuario]
    );

    const empleado = result.rows[0];

    if (!empleado) {
      await new Promise(r => setTimeout(r, 100));
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!empleado.activo) {
      return res.status(401).json({ error: 'Cuenta desactivada. Contacte al administrador' });
    }

    const validPassword = await bcrypt.compare(contrasena, empleado.contrasena_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      {
        id: empleado.id_empleado,
        usuario: empleado.usuario,
        nombre: `${empleado.nombre} ${empleado.apellido}`,
        rol: empleado.rol
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id: empleado.id_empleado,
        nombre: `${empleado.nombre} ${empleado.apellido}`,
        rol: empleado.rol
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

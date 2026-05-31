const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// Listar empleados
router.get('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id_empleado, nombre, apellido, numero_documento, cargo, usuario, rol, activo FROM empleado ORDER BY nombre'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar empleados' });
  }
});

// Registrar empleado (RF-08)
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  const { nombre, apellido, numero_documento, cargo, usuario, contrasena, rol } = req.body;

  if (!nombre || !apellido || !numero_documento || !cargo || !usuario || !contrasena || !rol) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  if (!['secretaria', 'administrador'].includes(rol)) {
    return res.status(400).json({ error: 'Rol debe ser secretaria o administrador' });
  }

  try {
    const existeUsuario = await pool.query('SELECT * FROM empleado WHERE usuario = $1', [usuario]);
    if (existeUsuario.rows.length > 0) {
      return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
    }

    const contrasena_hash = await bcrypt.hash(contrasena, 10);

    const result = await pool.query(
      `INSERT INTO empleado (nombre, apellido, numero_documento, cargo, usuario, contrasena_hash, rol)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_empleado, nombre, apellido, usuario, rol, activo`,
      [nombre, apellido, numero_documento, cargo, usuario, contrasena_hash, rol]
    );

    res.status(201).json({ mensaje: 'Empleado registrado', empleado: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar empleado' });
  }
});

// Desactivar empleado
router.put('/:id/desactivar', verificarToken, soloAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE empleado SET activo = FALSE WHERE id_empleado = $1 RETURNING id_empleado, nombre, apellido, activo',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    res.json({ mensaje: 'Empleado desactivado', empleado: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error al desactivar empleado' });
  }
});

// Cambiar rol
router.put('/:id/rol', verificarToken, soloAdmin, async (req, res) => {
  const { rol } = req.body;

  if (!['secretaria', 'administrador'].includes(rol)) {
    return res.status(400).json({ error: 'Rol debe ser secretaria o administrador' });
  }

  try {
    const result = await pool.query(
      'UPDATE empleado SET rol = $1 WHERE id_empleado = $2 RETURNING id_empleado, nombre, apellido, rol',
      [rol, req.params.id]
    );
    res.json({ mensaje: 'Rol actualizado', empleado: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error al cambiar rol' });
  }
});

module.exports = router;

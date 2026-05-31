const express = require('express');
const pool = require('../config/db');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// Listar clientes
router.get('/', verificarToken, async (req, res) => {
  try {
    const { buscar } = req.query;
    let query = 'SELECT * FROM propietario ORDER BY nombre, apellido';
    let params = [];

    if (buscar) {
      query = `SELECT * FROM propietario
               WHERE numero_documento ILIKE $1 OR nombre ILIKE $1 OR apellido ILIKE $1
               ORDER BY nombre, apellido`;
      params = [`%${buscar}%`];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar clientes' });
  }
});

// Obtener cliente por ID con vehículos
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const cliente = await pool.query('SELECT * FROM propietario WHERE id_propietario = $1', [req.params.id]);
    if (cliente.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron resultados' });
    }

    const vehiculos = await pool.query(`
      SELECT v.*, tv.nombre as tipo_vehiculo
      FROM vehiculo v
      JOIN tipo_vehiculo tv ON v.id_tipo_vehiculo = tv.id_tipo_vehiculo
      WHERE v.id_propietario = $1
    `, [req.params.id]);

    res.json({ ...cliente.rows[0], vehiculos: vehiculos.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar cliente' });
  }
});

// Registrar cliente
router.post('/', verificarToken, async (req, res) => {
  const { nombre, apellido, tipo_documento, numero_documento, telefono, correo } = req.body;

  if (!nombre || !apellido || !tipo_documento || !numero_documento) {
    return res.status(400).json({ error: 'Nombre, apellido, tipo y número de documento son requeridos' });
  }

  try {
    const existe = await pool.query(
      'SELECT * FROM propietario WHERE numero_documento = $1', [numero_documento]
    );
    if (existe.rows.length > 0) {
      return res.status(409).json({
        error: 'Ya existe un cliente con este número de documento',
        cliente: existe.rows[0]
      });
    }

    const result = await pool.query(
      `INSERT INTO propietario (nombre, apellido, tipo_documento, numero_documento, telefono, correo)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre, apellido, tipo_documento, numero_documento, telefono, correo]
    );

    res.status(201).json({ mensaje: 'Cliente registrado', cliente: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar cliente' });
  }
});

// Actualizar cliente
router.put('/:id', verificarToken, async (req, res) => {
  const { nombre, apellido, telefono, correo } = req.body;

  try {
    const result = await pool.query(
      `UPDATE propietario SET nombre = COALESCE($1, nombre), apellido = COALESCE($2, apellido),
       telefono = COALESCE($3, telefono), correo = COALESCE($4, correo)
       WHERE id_propietario = $5 RETURNING *`,
      [nombre, apellido, telefono, correo, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ mensaje: 'Datos actualizados exitosamente', cliente: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

module.exports = router;

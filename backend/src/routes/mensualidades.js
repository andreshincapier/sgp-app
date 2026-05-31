const express = require('express');
const pool = require('../config/db');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// Listar mensualidades activas
router.get('/', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, v.placa, tv.nombre as tipo_vehiculo,
             p.nombre || ' ' || p.apellido as propietario
      FROM mensualidad m
      JOIN vehiculo v ON m.id_vehiculo = v.id_vehiculo
      JOIN tipo_vehiculo tv ON v.id_tipo_vehiculo = tv.id_tipo_vehiculo
      JOIN propietario p ON m.id_propietario = p.id_propietario
      WHERE m.activa = TRUE
      ORDER BY m.fecha_fin ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar mensualidades' });
  }
});

// Crear mensualidad (RF-05)
router.post('/', verificarToken, async (req, res) => {
  const { id_vehiculo, id_propietario, fecha_inicio, fecha_fin, valor_pagado } = req.body;
  const id_empleado = req.usuario.id;

  if (!id_vehiculo || !id_propietario || !fecha_inicio || !fecha_fin || !valor_pagado) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    // Verificar si ya tiene mensualidad activa
    const existente = await pool.query(
      'SELECT * FROM mensualidad WHERE id_vehiculo = $1 AND activa = TRUE AND fecha_fin >= CURRENT_DATE',
      [id_vehiculo]
    );

    if (existente.rows.length > 0) {
      return res.status(409).json({
        error: `El vehículo ya tiene una mensualidad vigente hasta ${existente.rows[0].fecha_fin}`,
        sugerencia: 'Renueve al vencimiento'
      });
    }

    const result = await pool.query(
      `INSERT INTO mensualidad (id_vehiculo, id_propietario, fecha_inicio, fecha_fin, valor_pagado, id_empleado_registro)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id_vehiculo, id_propietario, fecha_inicio, fecha_fin, valor_pagado, id_empleado]
    );

    res.status(201).json({ mensaje: 'Mensualidad creada exitosamente', mensualidad: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear mensualidad' });
  }
});

// Anular mensualidad
router.put('/:id/anular', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE mensualidad SET activa = FALSE WHERE id_mensualidad = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mensualidad no encontrada' });
    }

    res.json({ mensaje: 'Mensualidad anulada', mensualidad: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error al anular mensualidad' });
  }
});

module.exports = router;

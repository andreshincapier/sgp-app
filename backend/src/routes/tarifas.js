const express = require('express');
const pool = require('../config/db');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// Listar tarifas activas
router.get('/', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, tv.nombre as tipo_vehiculo
      FROM tarifa t
      JOIN tipo_vehiculo tv ON t.id_tipo_vehiculo = tv.id_tipo_vehiculo
      WHERE t.activa = TRUE
      ORDER BY tv.nombre
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar tarifas' });
  }
});

// Historial de tarifas por tipo
router.get('/historial/:id_tipo', verificarToken, soloAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, tv.nombre as tipo_vehiculo
      FROM tarifa t
      JOIN tipo_vehiculo tv ON t.id_tipo_vehiculo = tv.id_tipo_vehiculo
      WHERE t.id_tipo_vehiculo = $1
      ORDER BY t.vigente_desde DESC
    `, [req.params.id_tipo]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar historial' });
  }
});

// Crear nueva tarifa (RB-06: solo admin)
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  const { id_tipo_vehiculo, valor_hora } = req.body;

  if (!id_tipo_vehiculo || !valor_hora) {
    return res.status(400).json({ error: 'Tipo de vehículo y valor por hora son requeridos' });
  }

  try {
    // Verificar si ya existe tarifa activa para ese tipo
    const existente = await pool.query(
      'SELECT * FROM tarifa WHERE id_tipo_vehiculo = $1 AND activa = TRUE',
      [id_tipo_vehiculo]
    );

    if (existente.rows.length > 0) {
      return res.status(409).json({
        error: 'Ya existe una tarifa activa para este tipo de vehículo',
        sugerencia: '¿Desea modificar la tarifa existente?'
      });
    }

    const result = await pool.query(
      'INSERT INTO tarifa (id_tipo_vehiculo, valor_hora) VALUES ($1, $2) RETURNING *',
      [id_tipo_vehiculo, valor_hora]
    );

    res.status(201).json({ mensaje: 'Tarifa creada exitosamente', tarifa: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear tarifa' });
  }
});

// Modificar tarifa (desactiva la anterior, crea nueva)
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  const { valor_hora } = req.body;
  const { id } = req.params;

  try {
    const tarifaActual = await pool.query('SELECT * FROM tarifa WHERE id_tarifa = $1', [id]);
    if (tarifaActual.rows.length === 0) {
      return res.status(404).json({ error: 'Tarifa no encontrada' });
    }

    // Desactivar la anterior
    await pool.query('UPDATE tarifa SET activa = FALSE WHERE id_tarifa = $1', [id]);

    // Crear nueva con el valor actualizado
    const nueva = await pool.query(
      'INSERT INTO tarifa (id_tipo_vehiculo, valor_hora) VALUES ($1, $2) RETURNING *',
      [tarifaActual.rows[0].id_tipo_vehiculo, valor_hora]
    );

    res.json({ mensaje: 'Tarifa actualizada', tarifa: nueva.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error al modificar tarifa' });
  }
});

// Desactivar tarifa
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE tarifa SET activa = FALSE WHERE id_tarifa = $1', [req.params.id]);
    res.json({ mensaje: 'Tarifa desactivada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al desactivar tarifa' });
  }
});

module.exports = router;

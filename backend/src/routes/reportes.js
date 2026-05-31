const express = require('express');
const pool = require('../config/db');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// Reporte de recaudación por rango de fechas (RF-09)
router.get('/recaudacion', verificarToken, soloAdmin, async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;

  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: 'Debe especificar fecha_inicio y fecha_fin' });
  }

  try {
    // Total general
    const total = await pool.query(`
      SELECT
        COUNT(*) as total_operaciones,
        COALESCE(SUM(valor_total), 0) as total_recaudado,
        COUNT(CASE WHEN es_mensualidad THEN 1 END) as operaciones_mensualidad,
        COUNT(CASE WHEN NOT es_mensualidad THEN 1 END) as operaciones_cobro
      FROM registro_estadia
      WHERE fecha_salida BETWEEN $1 AND $2 AND anulado = FALSE
    `, [fecha_inicio, fecha_fin]);

    // Desglose por tipo de vehículo
    const porTipo = await pool.query(`
      SELECT tv.nombre as tipo_vehiculo,
             COUNT(*) as cantidad,
             COALESCE(SUM(re.valor_total), 0) as recaudado
      FROM registro_estadia re
      JOIN vehiculo v ON re.id_vehiculo = v.id_vehiculo
      JOIN tipo_vehiculo tv ON v.id_tipo_vehiculo = tv.id_tipo_vehiculo
      WHERE re.fecha_salida BETWEEN $1 AND $2 AND re.anulado = FALSE
      GROUP BY tv.nombre
      ORDER BY recaudado DESC
    `, [fecha_inicio, fecha_fin]);

    // Mensualidades activas en el período
    const mensualidades = await pool.query(`
      SELECT COUNT(*) as total_activas, COALESCE(SUM(valor_pagado), 0) as valor_total
      FROM mensualidad
      WHERE activa = TRUE AND fecha_inicio <= $2 AND fecha_fin >= $1
    `, [fecha_inicio, fecha_fin]);

    res.json({
      periodo: { fecha_inicio, fecha_fin },
      resumen: total.rows[0],
      por_tipo_vehiculo: porTipo.rows,
      mensualidades: mensualidades.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// Reporte diario
router.get('/diario/:fecha', verificarToken, soloAdmin, async (req, res) => {
  const { fecha } = req.params;

  try {
    const result = await pool.query(`
      SELECT re.*, v.placa, tv.nombre as tipo_vehiculo,
             e1.nombre || ' ' || e1.apellido as empleado
      FROM registro_estadia re
      JOIN vehiculo v ON re.id_vehiculo = v.id_vehiculo
      JOIN tipo_vehiculo tv ON v.id_tipo_vehiculo = tv.id_tipo_vehiculo
      JOIN empleado e1 ON re.id_empleado_entrada = e1.id_empleado
      WHERE re.fecha_salida = $1 AND re.anulado = FALSE
      ORDER BY re.hora_salida DESC
    `, [fecha]);

    const totalRecaudado = result.rows.reduce((sum, r) => sum + parseFloat(r.valor_total || 0), 0);

    res.json({
      fecha,
      operaciones: result.rows,
      total_operaciones: result.rows.length,
      total_recaudado: totalRecaudado
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al generar reporte diario' });
  }
});

module.exports = router;

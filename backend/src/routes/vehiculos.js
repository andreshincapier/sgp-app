const express = require('express');
const pool = require('../config/db');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// Buscar vehículo por placa (RF-11)
router.get('/buscar/:placa', verificarToken, async (req, res) => {
  const { placa } = req.params;

  try {
    const result = await pool.query(`
      SELECT v.*, tv.nombre as tipo_vehiculo,
             p.nombre || ' ' || p.apellido as propietario,
             re.hora_entrada, re.fecha_entrada,
             EXTRACT(EPOCH FROM (NOW() - (re.fecha_entrada + re.hora_entrada))) / 3600 as horas_transcurridas
      FROM vehiculo v
      JOIN tipo_vehiculo tv ON v.id_tipo_vehiculo = tv.id_tipo_vehiculo
      JOIN propietario p ON v.id_propietario = p.id_propietario
      LEFT JOIN registro_estadia re ON v.id_vehiculo = re.id_vehiculo
        AND re.fecha_salida IS NULL AND re.anulado = FALSE
      WHERE v.placa ILIKE $1
      ORDER BY v.placa
    `, [`%${placa.toUpperCase()}%`]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron resultados' });
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error en la búsqueda' });
  }
});

// Registrar vehículo (RF-07)
router.post('/', verificarToken, async (req, res) => {
  const { placa, id_tipo_vehiculo, id_propietario, modelo, color, anio } = req.body;

  if (!placa || !id_tipo_vehiculo || !id_propietario) {
    return res.status(400).json({ error: 'Placa, tipo de vehículo y propietario son requeridos' });
  }

  try {
    const existe = await pool.query('SELECT * FROM vehiculo WHERE placa = $1', [placa.toUpperCase()]);
    if (existe.rows.length > 0) {
      return res.status(409).json({
        error: 'Ya existe un vehículo con esta placa',
        vehiculo: existe.rows[0]
      });
    }

    const result = await pool.query(
      `INSERT INTO vehiculo (placa, id_tipo_vehiculo, id_propietario, modelo, color, anio)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [placa.toUpperCase(), id_tipo_vehiculo, id_propietario, modelo, color, anio]
    );

    res.status(201).json({ mensaje: 'Vehículo registrado', vehiculo: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar vehículo' });
  }
});

// Historial de estadías de un vehículo (RF-12)
router.get('/historial/:placa', verificarToken, async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;

  try {
    let query = `
      SELECT re.*, v.placa, tv.nombre as tipo_vehiculo,
             e1.nombre || ' ' || e1.apellido as empleado_entrada,
             e2.nombre || ' ' || e2.apellido as empleado_salida
      FROM registro_estadia re
      JOIN vehiculo v ON re.id_vehiculo = v.id_vehiculo
      JOIN tipo_vehiculo tv ON v.id_tipo_vehiculo = tv.id_tipo_vehiculo
      JOIN empleado e1 ON re.id_empleado_entrada = e1.id_empleado
      LEFT JOIN empleado e2 ON re.id_empleado_salida = e2.id_empleado
      WHERE v.placa = $1 AND re.anulado = FALSE
    `;
    let params = [req.params.placa.toUpperCase()];

    if (fecha_inicio && fecha_fin) {
      query += ' AND re.fecha_entrada BETWEEN $2 AND $3';
      params.push(fecha_inicio, fecha_fin);
    }

    query += ' ORDER BY re.fecha_entrada DESC, re.hora_entrada DESC';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.json({ mensaje: 'El vehículo no tiene registros de estadía', registros: [] });
    }

    res.json({ registros: result.rows, total: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar historial' });
  }
});

// Listar tipos de vehículo
router.get('/tipos', verificarToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tipo_vehiculo WHERE activo = TRUE ORDER BY nombre');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar tipos' });
  }
});

module.exports = router;

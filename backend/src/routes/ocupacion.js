const express = require('express');
const pool = require('../config/db');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

const CAPACIDAD_TOTAL = 100;

// Consultar ocupación en tiempo real (RF-13)
router.get('/', verificarToken, async (req, res) => {
  try {
    // Total de vehículos activos
    const total = await pool.query(`
      SELECT COUNT(*) as ocupados
      FROM registro_estadia
      WHERE fecha_salida IS NULL AND anulado = FALSE
    `);

    // Desglose por tipo
    const porTipo = await pool.query(`
      SELECT tv.nombre as tipo_vehiculo, COUNT(*) as cantidad
      FROM registro_estadia re
      JOIN vehiculo v ON re.id_vehiculo = v.id_vehiculo
      JOIN tipo_vehiculo tv ON v.id_tipo_vehiculo = tv.id_tipo_vehiculo
      WHERE re.fecha_salida IS NULL AND re.anulado = FALSE
      GROUP BY tv.nombre
      ORDER BY cantidad DESC
    `);

    const ocupados = parseInt(total.rows[0].ocupados);
    const disponibles = CAPACIDAD_TOTAL - ocupados;
    const porcentaje = Math.round((ocupados / CAPACIDAD_TOTAL) * 100);

    let alerta = null;
    if (ocupados >= CAPACIDAD_TOTAL) {
      alerta = 'Parqueadero LLENO — 0 espacios disponibles';
    } else if (porcentaje >= 90) {
      alerta = `Alta ocupación: solo ${disponibles} espacios disponibles`;
    }

    res.json({
      capacidad_total: CAPACIDAD_TOTAL,
      ocupados,
      disponibles,
      porcentaje_ocupacion: porcentaje,
      alerta,
      por_tipo_vehiculo: porTipo.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar ocupación' });
  }
});

module.exports = router;

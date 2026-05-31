const express = require('express');
const pool = require('../config/db');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// Registrar ingreso de vehículo (RF-01)
router.post('/', verificarToken, async (req, res) => {
  const { placa, id_tipo_vehiculo, id_propietario, modelo, color, anio } = req.body;
  const id_empleado = req.usuario.id;

  if (!placa) {
    return res.status(400).json({ error: 'La placa es requerida' });
  }

  try {
    // Verificar si el vehículo existe
    let vehiculo = await pool.query('SELECT * FROM vehiculo WHERE placa = $1', [placa.toUpperCase()]);

    if (vehiculo.rows.length === 0) {
      // Registrar vehículo nuevo si se proporcionan datos
      if (!id_tipo_vehiculo || !id_propietario) {
        return res.status(400).json({
          error: 'Vehículo no registrado. Debe proporcionar tipo de vehículo y propietario',
          requiere_registro: true
        });
      }
      const nuevoVehiculo = await pool.query(
        `INSERT INTO vehiculo (placa, id_tipo_vehiculo, id_propietario, modelo, color, anio)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [placa.toUpperCase(), id_tipo_vehiculo, id_propietario, modelo, color, anio]
      );
      vehiculo = { rows: [nuevoVehiculo.rows[0]] };
    }

    const id_vehiculo = vehiculo.rows[0].id_vehiculo;

    // Verificar RB-01: no puede tener dos ingresos activos
    const ingresoActivo = await pool.query(
      'SELECT * FROM registro_estadia WHERE id_vehiculo = $1 AND fecha_salida IS NULL AND anulado = FALSE',
      [id_vehiculo]
    );

    if (ingresoActivo.rows.length > 0) {
      return res.status(409).json({
        error: 'El vehículo ya se encuentra registrado como ingresado',
        ingreso_activo: ingresoActivo.rows[0]
      });
    }

    // Registrar ingreso
    const registro = await pool.query(
      `INSERT INTO registro_estadia (id_vehiculo, id_empleado_entrada)
       VALUES ($1, $2) RETURNING *`,
      [id_vehiculo, id_empleado]
    );

    res.status(201).json({
      mensaje: 'Ingreso registrado exitosamente',
      registro: registro.rows[0],
      vehiculo: vehiculo.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar ingreso' });
  }
});

// Listar ingresos activos
router.get('/activos', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT re.*, v.placa, tv.nombre as tipo_vehiculo,
             p.nombre || ' ' || p.apellido as propietario,
             e.nombre || ' ' || e.apellido as empleado_entrada
      FROM registro_estadia re
      JOIN vehiculo v ON re.id_vehiculo = v.id_vehiculo
      JOIN tipo_vehiculo tv ON v.id_tipo_vehiculo = tv.id_tipo_vehiculo
      JOIN propietario p ON v.id_propietario = p.id_propietario
      JOIN empleado e ON re.id_empleado_entrada = e.id_empleado
      WHERE re.fecha_salida IS NULL AND re.anulado = FALSE
      ORDER BY re.fecha_entrada DESC, re.hora_entrada DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar ingresos activos' });
  }
});

module.exports = router;

const express = require('express');
const pool = require('../config/db');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// Registrar salida y calcular cobro (RF-02, RF-03)
router.post('/:placa', verificarToken, async (req, res) => {
  const { placa } = req.params;
  const id_empleado = req.usuario.id;

  try {
    // Buscar ingreso activo
    const ingreso = await pool.query(`
      SELECT re.*, v.id_tipo_vehiculo, v.placa, tv.nombre as tipo_vehiculo
      FROM registro_estadia re
      JOIN vehiculo v ON re.id_vehiculo = v.id_vehiculo
      JOIN tipo_vehiculo tv ON v.id_tipo_vehiculo = tv.id_tipo_vehiculo
      WHERE v.placa = $1 AND re.fecha_salida IS NULL AND re.anulado = FALSE
    `, [placa.toUpperCase()]);

    if (ingreso.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró un ingreso activo para esta placa' });
    }

    const registro = ingreso.rows[0];

    // Calcular horas usando la BD para evitar problemas de timezone
    const tiempoResult = await pool.query(`
      SELECT EXTRACT(EPOCH FROM (NOW() - (fecha_entrada + hora_entrada))) / 3600.0 as horas
      FROM registro_estadia WHERE id_registro = $1
    `, [registro.id_registro]);

    const diffHoras = parseFloat(tiempoResult.rows[0].horas) || 0;
    // RB-02: mínimo 1 hora, RB-03: redondeo hacia arriba
    const horasCobradas = Math.max(1, Math.ceil(diffHoras));

    // Verificar mensualidad vigente (RB-04)
    const mensualidad = await pool.query(`
      SELECT * FROM mensualidad
      WHERE id_vehiculo = $1 AND activa = TRUE
        AND fecha_inicio <= CURRENT_DATE AND fecha_fin >= CURRENT_DATE
    `, [registro.id_vehiculo]);

    let valorTotal = 0;
    let esMensualidad = false;

    if (mensualidad.rows.length > 0) {
      // RB-04: con mensualidad vigente no se cobra
      esMensualidad = true;
      valorTotal = 0;
    } else {
      // Obtener tarifa vigente
      const tarifa = await pool.query(`
        SELECT * FROM tarifa
        WHERE id_tipo_vehiculo = $1 AND activa = TRUE
        ORDER BY vigente_desde DESC LIMIT 1
      `, [registro.id_tipo_vehiculo]);

      if (tarifa.rows.length === 0) {
        return res.status(400).json({ error: 'No hay tarifa activa para este tipo de vehículo' });
      }

      valorTotal = horasCobradas * parseFloat(tarifa.rows[0].valor_hora);

      // Actualizar registro con tarifa
      await pool.query(
        'UPDATE registro_estadia SET id_tarifa = $1 WHERE id_registro = $2',
        [tarifa.rows[0].id_tarifa, registro.id_registro]
      );
    }

    // Actualizar registro de salida
    const salida = await pool.query(`
      UPDATE registro_estadia
      SET fecha_salida = CURRENT_DATE,
          hora_salida = CURRENT_TIME,
          id_empleado_salida = $1,
          horas_cobradas = $2,
          valor_total = $3,
          es_mensualidad = $4
      WHERE id_registro = $5
      RETURNING *
    `, [id_empleado, horasCobradas, valorTotal, esMensualidad, registro.id_registro]);

    // Generar recibo automáticamente (RF-03, RB-07)
    const numRecibo = `R-${String(await getNextReciboNum()).padStart(5, '0')}`;
    const recibo = await pool.query(`
      INSERT INTO recibo (id_registro, numero_recibo)
      VALUES ($1, $2) RETURNING *
    `, [registro.id_registro, numRecibo]);

    res.json({
      mensaje: esMensualidad ? 'Salida registrada — Cubierto por plan mensual' : 'Salida registrada exitosamente',
      salida: salida.rows[0],
      recibo: {
        ...recibo.rows[0],
        placa: registro.placa,
        tipo_vehiculo: registro.tipo_vehiculo,
        hora_entrada: registro.hora_entrada,
        hora_salida: salida.rows[0].hora_salida,
        horas_cobradas: horasCobradas,
        valor_total: valorTotal,
        es_mensualidad: esMensualidad
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar salida' });
  }
});

async function getNextReciboNum() {
  const result = await pool.query("SELECT nextval('seq_recibo')");
  return result.rows[0].nextval;
}

module.exports = router;

const express = require('express');
const pool = require('../config/db');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// Obtener recibo por número
router.get('/:numero', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, re.fecha_entrada, re.hora_entrada, re.fecha_salida, re.hora_salida,
             re.horas_cobradas, re.valor_total, re.es_mensualidad,
             v.placa, tv.nombre as tipo_vehiculo,
             t.valor_hora,
             p.nombre || ' ' || p.apellido as propietario
      FROM recibo r
      JOIN registro_estadia re ON r.id_registro = re.id_registro
      JOIN vehiculo v ON re.id_vehiculo = v.id_vehiculo
      JOIN tipo_vehiculo tv ON v.id_tipo_vehiculo = tv.id_tipo_vehiculo
      JOIN propietario p ON v.id_propietario = p.id_propietario
      LEFT JOIN tarifa t ON re.id_tarifa = t.id_tarifa
      WHERE r.numero_recibo = $1
    `, [req.params.numero]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recibo no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar recibo' });
  }
});

// Marcar como impreso
router.put('/:id/imprimir', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE recibo SET impreso = TRUE WHERE id_recibo = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recibo no encontrado' });
    }

    res.json({ mensaje: 'Recibo impreso correctamente', recibo: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error al imprimir recibo' });
  }
});

module.exports = router;

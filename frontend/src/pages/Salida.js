import React, { useState } from 'react';
import api from '../services/api';

function Salida() {
  const [placa, setPlaca] = useState('');
  const [recibo, setRecibo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRecibo(null);
    setLoading(true);

    try {
      const res = await api.post(`/salidas/${placa}`);
      setRecibo(res.data.recibo);
      setPlaca('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar salida');
    } finally {
      setLoading(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <h3>Registrar Salida y Cobrar</h3>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="input-group input-group-lg">
            <input
              type="text"
              className="form-control"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="Ingrese la placa del vehículo"
              required
              autoFocus
            />
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Procesando...' : 'Registrar Salida'}
            </button>
          </div>
        </form>

        {recibo && (
          <div className="card" id="recibo-print">
            <div className="card-header bg-dark text-white text-center">
              <h5>RECIBO DE PARQUEADERO</h5>
              <small>N° {recibo.numero_recibo}</small>
            </div>
            <div className="card-body">
              <table className="table table-sm">
                <tbody>
                  <tr><td><strong>Placa:</strong></td><td>{recibo.placa}</td></tr>
                  <tr><td><strong>Tipo:</strong></td><td>{recibo.tipo_vehiculo}</td></tr>
                  <tr><td><strong>Hora Ingreso:</strong></td><td>{recibo.hora_entrada}</td></tr>
                  <tr><td><strong>Hora Salida:</strong></td><td>{recibo.hora_salida}</td></tr>
                  <tr><td><strong>Horas Cobradas:</strong></td><td>{recibo.horas_cobradas}</td></tr>
                  {!recibo.es_mensualidad && (
                    <tr><td><strong>Tarifa/Hora:</strong></td><td>${Number(recibo.valor_total / recibo.horas_cobradas).toLocaleString()}</td></tr>
                  )}
                  <tr className="table-dark">
                    <td><strong>TOTAL:</strong></td>
                    <td><strong>
                      {recibo.es_mensualidad
                        ? '$0 — Cubierto por plan mensual'
                        : `$${Number(recibo.valor_total).toLocaleString()}`
                      }
                    </strong></td>
                  </tr>
                </tbody>
              </table>
              <small className="text-muted">Fecha: {new Date(recibo.fecha_emision).toLocaleString()}</small>
            </div>
            <div className="card-footer">
              <button className="btn btn-outline-dark w-100" onClick={handleImprimir}>
                Imprimir Recibo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Salida;

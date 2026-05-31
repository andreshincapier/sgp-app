import React, { useState } from 'react';
import api from '../services/api';

function Reportes() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState(null);
  const [error, setError] = useState('');

  const handleGenerar = async (e) => {
    e.preventDefault();
    setError('');
    setReporte(null);

    try {
      const res = await api.get(`/reportes/recaudacion?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
      setReporte(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar reporte');
    }
  };

  return (
    <div>
      <h3>Reportes Administrativos</h3>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleGenerar} className="row mb-4">
        <div className="col-md-3">
          <label className="form-label">Fecha Inicio</label>
          <input type="date" className="form-control" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />
        </div>
        <div className="col-md-3">
          <label className="form-label">Fecha Fin</label>
          <input type="date" className="form-control" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} required />
        </div>
        <div className="col-md-3 d-flex align-items-end">
          <button type="submit" className="btn btn-primary">Generar Reporte</button>
        </div>
      </form>

      {reporte && (
        <div>
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h4>${Number(reporte.resumen.total_recaudado).toLocaleString()}</h4>
                  <small>Total Recaudado</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h4>{reporte.resumen.total_operaciones}</h4>
                  <small>Total Operaciones</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <h4>{reporte.resumen.operaciones_cobro}</h4>
                  <small>Cobros por Hora</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-secondary text-white">
                <div className="card-body text-center">
                  <h4>{reporte.resumen.operaciones_mensualidad}</h4>
                  <small>Con Mensualidad</small>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <h5>Recaudación por tipo de vehículo</h5>
              <table className="table">
                <thead><tr><th>Tipo</th><th>Cantidad</th><th>Recaudado</th></tr></thead>
                <tbody>
                  {reporte.por_tipo_vehiculo.map((t, i) => (
                    <tr key={i}>
                      <td>{t.tipo_vehiculo}</td>
                      <td>{t.cantidad}</td>
                      <td>${Number(t.recaudado).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h5>Mensualidades en el período</h5>
              <p>Activas: <strong>{reporte.mensualidades.total_activas}</strong></p>
              <p>Valor total: <strong>${Number(reporte.mensualidades.valor_total).toLocaleString()}</strong></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reportes;

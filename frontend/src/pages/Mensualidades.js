import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Mensualidades() {
  const [mensualidades, setMensualidades] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = () => {
    api.get('/mensualidades').then(res => setMensualidades(res.data)).catch(() => {});
  };

  useEffect(() => { cargar(); }, []);

  const handleAnular = async (id) => {
    if (!window.confirm('¿Anular esta mensualidad?')) return;
    try {
      await api.put(`/mensualidades/${id}/anular`);
      setMensaje('Mensualidad anulada');
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div>
      <h3>Mensualidades Activas</h3>

      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <table className="table table-striped">
        <thead>
          <tr><th>Placa</th><th>Tipo</th><th>Propietario</th><th>Inicio</th><th>Vencimiento</th><th>Valor</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {mensualidades.map(m => {
            const vence = new Date(m.fecha_fin);
            const hoy = new Date();
            const diasRestantes = Math.ceil((vence - hoy) / (1000*60*60*24));
            return (
              <tr key={m.id_mensualidad}>
                <td><strong>{m.placa}</strong></td>
                <td>{m.tipo_vehiculo}</td>
                <td>{m.propietario}</td>
                <td>{new Date(m.fecha_inicio).toLocaleDateString()}</td>
                <td>
                  {new Date(m.fecha_fin).toLocaleDateString()}
                  {diasRestantes <= 5 && <span className="badge bg-warning ms-1">Pronto a vencer</span>}
                </td>
                <td>${Number(m.valor_pagado).toLocaleString()}</td>
                <td>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleAnular(m.id_mensualidad)}>
                    Anular
                  </button>
                </td>
              </tr>
            );
          })}
          {mensualidades.length === 0 && (
            <tr><td colSpan="7" className="text-center text-muted">No hay mensualidades activas</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Mensualidades;

import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Tarifas() {
  const [tarifas, setTarifas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [idTipo, setIdTipo] = useState('');
  const [valorHora, setValorHora] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = () => {
    api.get('/tarifas').then(res => setTarifas(res.data)).catch(() => {});
    api.get('/vehiculos/tipos').then(res => setTipos(res.data)).catch(() => {});
  };

  useEffect(() => { cargar(); }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    setError(''); setMensaje('');
    try {
      const res = await api.post('/tarifas', { id_tipo_vehiculo: parseInt(idTipo), valor_hora: parseFloat(valorHora) });
      setMensaje(res.data.mensaje);
      setIdTipo(''); setValorHora('');
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  const handleModificar = async (tarifa) => {
    const nuevoValor = prompt(`Nuevo valor/hora para ${tarifa.tipo_vehiculo} (actual: $${tarifa.valor_hora}):`);
    if (!nuevoValor) return;
    try {
      await api.put(`/tarifas/${tarifa.id_tarifa}`, { valor_hora: parseFloat(nuevoValor) });
      setMensaje('Tarifa actualizada');
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div>
      <h3>Gestión de Tarifas</h3>

      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        <div className="col-md-8">
          <table className="table">
            <thead><tr><th>Tipo Vehículo</th><th>Valor/Hora</th><th>Vigente Desde</th><th>Acciones</th></tr></thead>
            <tbody>
              {tarifas.map(t => (
                <tr key={t.id_tarifa}>
                  <td>{t.tipo_vehiculo}</td>
                  <td><strong>${Number(t.valor_hora).toLocaleString()}</strong></td>
                  <td>{new Date(t.vigente_desde).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleModificar(t)}>
                      Modificar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h6>Nueva Tarifa</h6>
              <form onSubmit={handleCrear}>
                <div className="mb-2">
                  <select className="form-select" value={idTipo} onChange={(e) => setIdTipo(e.target.value)} required>
                    <option value="">Tipo vehículo...</option>
                    {tipos.map(t => <option key={t.id_tipo_vehiculo} value={t.id_tipo_vehiculo}>{t.nombre}</option>)}
                  </select>
                </div>
                <div className="mb-2">
                  <input type="number" className="form-control" placeholder="Valor/hora" value={valorHora} onChange={(e) => setValorHora(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary w-100">Crear</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tarifas;

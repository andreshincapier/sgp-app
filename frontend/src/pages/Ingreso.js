import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Ingreso() {
  const [placa, setPlaca] = useState('');
  const [tipos, setTipos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [idTipo, setIdTipo] = useState('');
  const [idPropietario, setIdPropietario] = useState('');
  const [modelo, setModelo] = useState('');
  const [color, setColor] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [requiereRegistro, setRequiereRegistro] = useState(false);

  useEffect(() => {
    api.get('/vehiculos/tipos').then(res => setTipos(res.data)).catch(() => {});
    api.get('/clientes').then(res => setClientes(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    try {
      const body = { placa };
      if (requiereRegistro) {
        body.id_tipo_vehiculo = parseInt(idTipo);
        body.id_propietario = parseInt(idPropietario);
        body.modelo = modelo;
        body.color = color;
      }

      const res = await api.post('/ingresos', body);
      setMensaje(res.data.mensaje);
      setPlaca('');
      setRequiereRegistro(false);
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiere_registro) {
        setRequiereRegistro(true);
        setError(data.error);
      } else {
        setError(data?.error || 'Error al registrar ingreso');
      }
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <h3>Registrar Ingreso de Vehículo</h3>

        {mensaje && <div className="alert alert-success">{mensaje}</div>}
        {error && <div className="alert alert-warning">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Placa del Vehículo</label>
            <input
              type="text"
              className="form-control form-control-lg"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="Ej: ABC123"
              required
              autoFocus
            />
          </div>

          {requiereRegistro && (
            <div className="card p-3 mb-3">
              <h6>Datos del vehículo nuevo</h6>
              <div className="mb-2">
                <label className="form-label">Tipo de vehículo</label>
                <select className="form-select" value={idTipo} onChange={(e) => setIdTipo(e.target.value)} required>
                  <option value="">Seleccionar...</option>
                  {tipos.map(t => (
                    <option key={t.id_tipo_vehiculo} value={t.id_tipo_vehiculo}>{t.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="form-label">Propietario</label>
                <select className="form-select" value={idPropietario} onChange={(e) => setIdPropietario(e.target.value)} required>
                  <option value="">Seleccionar...</option>
                  {clientes.map(c => (
                    <option key={c.id_propietario} value={c.id_propietario}>
                      {c.nombre} {c.apellido} - {c.numero_documento}
                    </option>
                  ))}
                </select>
              </div>
              <div className="row">
                <div className="col-md-6 mb-2">
                  <label className="form-label">Modelo</label>
                  <input type="text" className="form-control" value={modelo} onChange={(e) => setModelo(e.target.value)} />
                </div>
                <div className="col-md-6 mb-2">
                  <label className="form-label">Color</label>
                  <input type="text" className="form-control" value={color} onChange={(e) => setColor(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg w-100">
            Registrar Ingreso
          </button>
        </form>
      </div>
    </div>
  );
}

export default Ingreso;

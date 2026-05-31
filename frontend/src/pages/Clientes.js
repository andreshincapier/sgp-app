import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [form, setForm] = useState({ nombre: '', apellido: '', tipo_documento: 'CC', numero_documento: '', telefono: '', correo: '' });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const cargar = (q) => {
    const params = q ? `?buscar=${q}` : '';
    api.get(`/clientes${params}`).then(res => setClientes(res.data)).catch(() => {});
  };

  useEffect(() => { cargar(); }, []);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargar(buscar);
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    setError(''); setMensaje('');
    try {
      const res = await api.post('/clientes', form);
      setMensaje(res.data.mensaje);
      setForm({ nombre: '', apellido: '', tipo_documento: 'CC', numero_documento: '', telefono: '', correo: '' });
      setShowForm(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Gestión de Clientes</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Nuevo Cliente'}
        </button>
      </div>

      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleBuscar} className="mb-3">
        <div className="input-group">
          <input type="text" className="form-control" placeholder="Buscar por nombre o documento..." value={buscar} onChange={(e) => setBuscar(e.target.value)} />
          <button type="submit" className="btn btn-outline-secondary">Buscar</button>
        </div>
      </form>

      {showForm && (
        <div className="card mb-3">
          <div className="card-body">
            <h6>Registrar Cliente</h6>
            <form onSubmit={handleCrear}>
              <div className="row">
                <div className="col-md-4 mb-2">
                  <input type="text" className="form-control" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} required />
                </div>
                <div className="col-md-4 mb-2">
                  <input type="text" className="form-control" placeholder="Apellido" value={form.apellido} onChange={(e) => setForm({...form, apellido: e.target.value})} required />
                </div>
                <div className="col-md-4 mb-2">
                  <select className="form-select" value={form.tipo_documento} onChange={(e) => setForm({...form, tipo_documento: e.target.value})}>
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="NIT">NIT</option>
                  </select>
                </div>
                <div className="col-md-4 mb-2">
                  <input type="text" className="form-control" placeholder="N° Documento" value={form.numero_documento} onChange={(e) => setForm({...form, numero_documento: e.target.value})} required />
                </div>
                <div className="col-md-4 mb-2">
                  <input type="text" className="form-control" placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} />
                </div>
                <div className="col-md-4 mb-2">
                  <input type="email" className="form-control" placeholder="Correo" value={form.correo} onChange={(e) => setForm({...form, correo: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn btn-success">Registrar</button>
            </form>
          </div>
        </div>
      )}

      <table className="table table-striped">
        <thead><tr><th>Documento</th><th>Nombre</th><th>Teléfono</th><th>Correo</th></tr></thead>
        <tbody>
          {clientes.map(c => (
            <tr key={c.id_propietario}>
              <td>{c.tipo_documento} {c.numero_documento}</td>
              <td>{c.nombre} {c.apellido}</td>
              <td>{c.telefono || '-'}</td>
              <td>{c.correo || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Clientes;

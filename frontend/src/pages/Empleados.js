import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [form, setForm] = useState({ nombre: '', apellido: '', numero_documento: '', cargo: '', usuario: '', contrasena: '', rol: 'secretaria' });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const cargar = () => {
    api.get('/empleados').then(res => setEmpleados(res.data)).catch(() => {});
  };

  useEffect(() => { cargar(); }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    setError(''); setMensaje('');
    try {
      const res = await api.post('/empleados', form);
      setMensaje(res.data.mensaje);
      setForm({ nombre: '', apellido: '', numero_documento: '', cargo: '', usuario: '', contrasena: '', rol: 'secretaria' });
      setShowForm(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  const handleDesactivar = async (id) => {
    if (!window.confirm('¿Desactivar este empleado?')) return;
    try {
      await api.put(`/empleados/${id}/desactivar`);
      setMensaje('Empleado desactivado');
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Gestión de Empleados</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Nuevo Empleado'}
        </button>
      </div>

      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {showForm && (
        <div className="card mb-3">
          <div className="card-body">
            <form onSubmit={handleCrear}>
              <div className="row">
                <div className="col-md-3 mb-2">
                  <input type="text" className="form-control" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} required />
                </div>
                <div className="col-md-3 mb-2">
                  <input type="text" className="form-control" placeholder="Apellido" value={form.apellido} onChange={(e) => setForm({...form, apellido: e.target.value})} required />
                </div>
                <div className="col-md-3 mb-2">
                  <input type="text" className="form-control" placeholder="Documento" value={form.numero_documento} onChange={(e) => setForm({...form, numero_documento: e.target.value})} required />
                </div>
                <div className="col-md-3 mb-2">
                  <input type="text" className="form-control" placeholder="Cargo" value={form.cargo} onChange={(e) => setForm({...form, cargo: e.target.value})} required />
                </div>
                <div className="col-md-3 mb-2">
                  <input type="text" className="form-control" placeholder="Usuario" value={form.usuario} onChange={(e) => setForm({...form, usuario: e.target.value})} required />
                </div>
                <div className="col-md-3 mb-2">
                  <input type="password" className="form-control" placeholder="Contraseña" value={form.contrasena} onChange={(e) => setForm({...form, contrasena: e.target.value})} required />
                </div>
                <div className="col-md-3 mb-2">
                  <select className="form-select" value={form.rol} onChange={(e) => setForm({...form, rol: e.target.value})}>
                    <option value="secretaria">Secretaria</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>
                <div className="col-md-3 mb-2">
                  <button type="submit" className="btn btn-success w-100">Registrar</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="table table-striped">
        <thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          {empleados.map(e => (
            <tr key={e.id_empleado}>
              <td>{e.nombre} {e.apellido}</td>
              <td>{e.usuario}</td>
              <td><span className={`badge ${e.rol === 'administrador' ? 'bg-danger' : 'bg-primary'}`}>{e.rol}</span></td>
              <td><span className={`badge ${e.activo ? 'bg-success' : 'bg-secondary'}`}>{e.activo ? 'Activo' : 'Inactivo'}</span></td>
              <td>
                {e.activo && (
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDesactivar(e.id_empleado)}>
                    Desactivar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Empleados;

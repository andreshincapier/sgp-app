import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Ocupacion() {
  const [data, setData] = useState(null);
  const [activos, setActivos] = useState([]);

  const cargar = () => {
    api.get('/ocupacion').then(res => setData(res.data)).catch(() => {});
    api.get('/ingresos/activos').then(res => setActivos(res.data)).catch(() => {});
  };

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <p>Cargando...</p>;

  const porcentaje = data.porcentaje_ocupacion;
  let barColor = 'bg-success';
  if (porcentaje >= 90) barColor = 'bg-danger';
  else if (porcentaje >= 70) barColor = 'bg-warning';

  return (
    <div>
      <h3>Ocupación del Parqueadero</h3>

      {data.alerta && <div className="alert alert-danger">{data.alerta}</div>}

      <div className="row mb-4">
        <div className="col-md-8">
          <div className="progress" style={{ height: '40px' }}>
            <div
              className={`progress-bar ${barColor}`}
              style={{ width: `${porcentaje}%` }}
            >
              {porcentaje}% Ocupado
            </div>
          </div>
          <p className="mt-2">
            <strong>{data.ocupados}</strong> ocupados / <strong>{data.disponibles}</strong> disponibles
            (Capacidad: {data.capacidad_total})
          </p>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <h5>Por tipo de vehículo</h5>
          <table className="table table-sm">
            <thead><tr><th>Tipo</th><th>Cantidad</th></tr></thead>
            <tbody>
              {data.por_tipo_vehiculo.map((t, i) => (
                <tr key={i}><td>{t.tipo_vehiculo}</td><td>{t.cantidad}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h5>Vehículos actualmente ingresados</h5>
      <table className="table table-striped table-sm">
        <thead>
          <tr><th>Placa</th><th>Tipo</th><th>Propietario</th><th>Hora Ingreso</th><th>Empleado</th></tr>
        </thead>
        <tbody>
          {activos.map((v, i) => (
            <tr key={i}>
              <td><strong>{v.placa}</strong></td>
              <td>{v.tipo_vehiculo}</td>
              <td>{v.propietario}</td>
              <td>{v.hora_entrada}</td>
              <td>{v.empleado_entrada}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Ocupacion;

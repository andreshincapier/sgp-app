import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Dashboard() {
  const { usuario } = useAuth();
  const [ocupacion, setOcupacion] = useState(null);

  useEffect(() => {
    api.get('/ocupacion').then(res => setOcupacion(res.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h2>Panel Principal</h2>
      <p className="text-muted">Bienvenido, {usuario?.nombre}</p>

      {ocupacion && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h4>{ocupacion.ocupados}</h4>
                <small>Vehículos Ingresados</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <h4>{ocupacion.disponibles}</h4>
                <small>Espacios Disponibles</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <h4>{ocupacion.porcentaje_ocupacion}%</h4>
                <small>Ocupación</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-secondary text-white">
              <div className="card-body text-center">
                <h4>{ocupacion.capacidad_total}</h4>
                <small>Capacidad Total</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {ocupacion?.alerta && (
        <div className="alert alert-danger">{ocupacion.alerta}</div>
      )}

      <div className="row">
        <div className="col-md-4 mb-3">
          <Link to="/ingreso" className="card text-decoration-none">
            <div className="card-body text-center">
              <h5>Registrar Ingreso</h5>
              <p className="text-muted">Registrar entrada de vehículo</p>
            </div>
          </Link>
        </div>
        <div className="col-md-4 mb-3">
          <Link to="/salida" className="card text-decoration-none">
            <div className="card-body text-center">
              <h5>Registrar Salida</h5>
              <p className="text-muted">Salida y cobro automático</p>
            </div>
          </Link>
        </div>
        <div className="col-md-4 mb-3">
          <Link to="/ocupacion" className="card text-decoration-none">
            <div className="card-body text-center">
              <h5>Ocupación</h5>
              <p className="text-muted">Ver estado en tiempo real</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

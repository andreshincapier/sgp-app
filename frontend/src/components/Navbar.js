import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/dashboard">SGP - Parqueadero</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/ingreso">Ingreso</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/salida">Salida</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/ocupacion">Ocupación</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/clientes">Clientes</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/mensualidades">Mensualidades</Link>
            </li>
            {usuario?.rol === 'administrador' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/tarifas">Tarifas</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/empleados">Empleados</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/reportes">Reportes</Link>
                </li>
              </>
            )}
          </ul>
          <span className="navbar-text me-3">
            {usuario?.nombre} ({usuario?.rol})
          </span>
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

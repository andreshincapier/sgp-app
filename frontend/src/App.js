import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Ingreso from './pages/Ingreso';
import Salida from './pages/Salida';
import Ocupacion from './pages/Ocupacion';
import Tarifas from './pages/Tarifas';
import Clientes from './pages/Clientes';
import Empleados from './pages/Empleados';
import Mensualidades from './pages/Mensualidades';
import Reportes from './pages/Reportes';
import Navbar from './components/Navbar';

function PrivateRoute({ children }) {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/" />;
}

function AppRoutes() {
  const { usuario } = useAuth();

  if (!usuario) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container-fluid mt-3">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ingreso" element={<Ingreso />} />
          <Route path="/salida" element={<Salida />} />
          <Route path="/ocupacion" element={<Ocupacion />} />
          <Route path="/tarifas" element={<Tarifas />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/empleados" element={<Empleados />} />
          <Route path="/mensualidades" element={<Mensualidades />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

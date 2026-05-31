import React, { createContext, useState, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem('sgp_usuario');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (user, contrasena) => {
    const res = await api.post('/auth/login', { usuario: user, contrasena });
    localStorage.setItem('sgp_token', res.data.token);
    localStorage.setItem('sgp_usuario', JSON.stringify(res.data.usuario));
    setUsuario(res.data.usuario);
    return res.data.usuario;
  };

  const logout = () => {
    localStorage.removeItem('sgp_token');
    localStorage.removeItem('sgp_usuario');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

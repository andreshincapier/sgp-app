// Configuración global de Jest. Se ejecuta antes de cada suite.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'sgp_jwt_secret_test';
process.env.NODE_ENV = 'test';

// Silenciar console.error en tests salvo que se quiera depurar
const originalError = console.error;
console.error = (...args) => {
  if (process.env.DEBUG_TESTS === 'true') originalError(...args);
};

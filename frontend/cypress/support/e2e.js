// Configuración global de Cypress E2E.
import './commands';

// Evita fallos de tests por errores de la aplicación que no afectan al flujo de prueba
Cypress.on('uncaught:exception', () => false);

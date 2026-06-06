/// <reference types="cypress" />

// CP-09: Monitor de ocupación en tiempo real (RF-13, UC-13)
describe('CP-09: Monitor de ocupación', () => {
  beforeEach(() => {
    cy.loginSecretaria();
  });

  it('CP-09.1 — La página de ocupación muestra ocupados, disponibles y porcentaje', () => {
    cy.visit('/ocupacion');

    // Debe aparecer la información clave de capacidad
    cy.contains(/ocupado|disponible|capacidad/i, { timeout: 8000 }).should('be.visible');
    // Debe haber un indicador de porcentaje (puede ser una barra de progreso o un %)
    cy.get('body').should('contain.text', '%');
  });

  it('Dashboard muestra indicadores agregados de ocupación (RF-13)', () => {
    cy.visit('/dashboard');

    // El dashboard debe tener tarjetas con indicadores
    cy.contains(/Vehículos|Ocupación|Espacios|Capacidad/i, { timeout: 8000 }).should('be.visible');
  });
});

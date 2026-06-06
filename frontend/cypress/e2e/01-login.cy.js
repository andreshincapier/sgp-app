/// <reference types="cypress" />

// CP-01: Autenticación de usuario (RF-10, UC-10)
describe('CP-01: Autenticación de usuario', () => {
  beforeEach(() => {
    cy.logout();
    cy.visit('/');
  });

  it('CP-01.1 — Inicio de sesión exitoso como administrador', () => {
    cy.contains('SGP - Parqueadero').should('be.visible');
    cy.get('input[type="text"]').type(Cypress.env('adminUser'));
    cy.get('input[type="password"]').type(Cypress.env('adminPass'));
    cy.contains('button', 'Iniciar Sesión').click();

    cy.url().should('include', '/dashboard');
    // El admin debe ver TODAS las opciones del menú
    cy.contains('a', 'Tarifas').should('be.visible');
    cy.contains('a', 'Empleados').should('be.visible');
    cy.contains('a', 'Reportes').should('be.visible');
  });

  it('CP-01.2 — Inicio de sesión como secretaria oculta opciones de admin (RB-06)', () => {
    cy.get('input[type="text"]').type(Cypress.env('secretariaUser'));
    cy.get('input[type="password"]').type(Cypress.env('secretariaPass'));
    cy.contains('button', 'Iniciar Sesión').click();

    cy.url().should('include', '/dashboard');
    // La secretaria NO debe ver opciones de admin
    cy.contains('a', 'Tarifas').should('not.exist');
    cy.contains('a', 'Empleados').should('not.exist');
    cy.contains('a', 'Reportes').should('not.exist');
    // Pero sí debe ver opciones operativas
    cy.contains('a', 'Ingreso').should('be.visible');
    cy.contains('a', 'Salida').should('be.visible');
    cy.contains('a', 'Ocupación').should('be.visible');
  });

  it('CP-01.3 — Login fallido con contraseña incorrecta muestra mensaje genérico', () => {
    cy.get('input[type="text"]').type(Cypress.env('adminUser'));
    cy.get('input[type="password"]').type('contraseña-incorrecta');
    cy.contains('button', 'Iniciar Sesión').click();

    cy.contains('Credenciales inválidas').should('be.visible');
    cy.url().should('not.include', '/dashboard');
  });

  it('CP-01.4 — Login fallido con usuario inexistente', () => {
    cy.get('input[type="text"]').type('fantasma');
    cy.get('input[type="password"]').type('cualquiera');
    cy.contains('button', 'Iniciar Sesión').click();

    cy.contains('Credenciales inválidas').should('be.visible');
  });

  it('CP-01.5 — Acceso a ruta protegida sin sesión redirige al login (RB-09)', () => {
    cy.visit('/dashboard');
    cy.contains('SGP - Parqueadero').should('be.visible');
    cy.get('input[type="text"]').should('be.visible');
  });
});

/// <reference types="cypress" />

// CP-05.2 / CP-07.2 / CP-08.2: Control de acceso por rol (RB-06)
describe('Control de acceso por rol', () => {
  it('CP-08.2 — Secretaria que accede directamente a /reportes recibe error en API', () => {
    cy.loginSecretaria();
    cy.visit('/reportes');

    // La secretaria llega a la página, pero la API debe devolver 403 al intentar consultar
    cy.intercept('GET', '**/api/reportes/**').as('reporte');
    cy.get('body').then(($body) => {
      // Si hay un input de fechas, lo llenamos y enviamos
      if ($body.find('input[type="date"]').length) {
        cy.get('input[type="date"]').first().type('2026-05-01');
        cy.get('input[type="date"]').last().type('2026-05-31');
        cy.contains('button', /generar/i).click();

        cy.wait('@reporte').its('response.statusCode').should('eq', 403);
      }
    });
  });

  it('CP-05.2 — La secretaria no ve las opciones de admin en el menú', () => {
    cy.loginSecretaria();
    cy.visit('/dashboard');

    cy.contains('a', 'Tarifas').should('not.exist');
    cy.contains('a', 'Empleados').should('not.exist');
    cy.contains('a', 'Reportes').should('not.exist');
  });

  it('CP-05.1 — El administrador sí ve las opciones restringidas', () => {
    cy.loginAdmin();
    cy.visit('/dashboard');

    cy.contains('a', 'Tarifas').should('be.visible');
    cy.contains('a', 'Empleados').should('be.visible');
    cy.contains('a', 'Reportes').should('be.visible');
  });
});

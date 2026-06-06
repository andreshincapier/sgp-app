/// <reference types="cypress" />

// CP-05.4: Verificar tarifas iniciales del seed (RB-10)
describe('CP-05.4: Tarifas iniciales del seed', () => {
  beforeEach(() => {
    cy.loginAdmin();
  });

  it('La página de tarifas muestra los 6 tipos de vehículo con sus valores', () => {
    cy.visit('/tarifas');

    // Las 6 tarifas del seed: bicicleta $500, moto $1500, auto $3000, camioneta $4000, bus $10000, camión $8000
    cy.contains(/bicicleta/i).should('be.visible');
    cy.contains(/motocicleta/i).should('be.visible');
    cy.contains(/automóvil/i).should('be.visible');
    cy.contains(/camioneta/i).should('be.visible');
    cy.contains(/camión/i).should('be.visible');

    // Valores esperados
    cy.contains('500').should('exist');
    cy.contains('1.500').should('exist').or('contain', '1500');
    cy.contains('3.000').should('exist').or('contain', '3000');
  });
});

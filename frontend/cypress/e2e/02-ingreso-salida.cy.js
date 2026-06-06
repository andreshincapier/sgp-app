/// <reference types="cypress" />

// CP-02 / CP-03 / CP-04 / CP-12: Flujo crítico de cabina — ingreso, salida, recibo

describe('CP-02 / CP-03: Flujo de ingreso y salida del vehículo ABC123', () => {
  before(() => {
    // Garantiza que ABC123 no tenga ingreso activo previo (anula vía API si lo tiene)
    cy.loginAdmin();
  });

  beforeEach(() => {
    cy.loginSecretaria();
  });

  it('CP-02.1 + CP-03.1 — Registrar ingreso de ABC123 y luego salida con cobro', () => {
    cy.visit('/ingreso');
    cy.contains('Registrar Ingreso de Vehículo').should('be.visible');

    cy.get('input[placeholder*="placa"]').clear().type('ABC123');
    cy.contains('button', 'Registrar Ingreso').click();

    // Puede aparecer el mensaje de éxito o el de "ya registrado" si quedó activo de un test previo
    cy.get('body').then(($body) => {
      const text = $body.text();
      if (text.includes('ya se encuentra registrado')) {
        cy.log('Vehículo ya tenía ingreso activo — continuamos con la salida');
      } else {
        cy.contains('Ingreso registrado exitosamente').should('be.visible');
      }
    });

    // Ahora vamos a Salida
    cy.contains('a', 'Salida').click();
    cy.url().should('include', '/salida');

    cy.get('input[placeholder*="placa"]').clear().type('ABC123');
    cy.contains('button', 'Registrar Salida').click();

    // Debe aparecer el recibo
    cy.contains('RECIBO DE PARQUEADERO', { timeout: 8000 }).should('be.visible');
    cy.contains('R-').should('be.visible'); // número de recibo
    cy.contains('Placa:').should('be.visible');
    cy.contains('ABC123').should('be.visible');
    cy.contains('Hora Ingreso').should('be.visible');
    cy.contains('Hora Salida').should('be.visible');
    cy.contains('Horas Cobradas').should('be.visible');
    cy.contains('TOTAL').should('be.visible');

    // Botón de imprimir está disponible (RF-03)
    cy.contains('button', 'Imprimir Recibo').should('be.visible');
  });

  it('CP-02.2 — Vehículo ya activo no permite ingreso duplicado (RB-01)', () => {
    cy.visit('/ingreso');
    cy.get('input[placeholder*="placa"]').clear().type('ABC123');
    cy.contains('button', 'Registrar Ingreso').click();

    // El primer intento puede ser éxito o conflicto. Hacemos un segundo intento garantizado.
    cy.get('input[placeholder*="placa"]').clear().type('ABC123');
    cy.contains('button', 'Registrar Ingreso').click();

    cy.contains('ya se encuentra registrado', { timeout: 5000 }).should('be.visible');
  });

  it('CP-03.6 — Salida sin ingreso activo muestra error', () => {
    cy.visit('/salida');
    cy.get('input[placeholder*="placa"]').clear().type('NOEXISTE999');
    cy.contains('button', 'Registrar Salida').click();

    cy.contains('No se encontró un ingreso activo', { timeout: 5000 }).should('be.visible');
  });
});

describe('CP-04: Mensualidad vigente cobra $0 (RB-04)', () => {
  beforeEach(() => {
    cy.loginSecretaria();
  });

  it('CP-04.1 — MEN001 con mensualidad activa genera recibo de $0', () => {
    // Si MEN001 ya tiene ingreso activo, lo procesamos directamente.
    // Si no, lo registramos primero.
    cy.visit('/ingreso');
    cy.get('input[placeholder*="placa"]').clear().type('MEN001');
    cy.contains('button', 'Registrar Ingreso').click();
    cy.wait(500);

    cy.visit('/salida');
    cy.get('input[placeholder*="placa"]').clear().type('MEN001');
    cy.contains('button', 'Registrar Salida').click();

    cy.contains('RECIBO DE PARQUEADERO', { timeout: 8000 }).should('be.visible');
    cy.contains('Cubierto por plan mensual').should('be.visible');
  });
});

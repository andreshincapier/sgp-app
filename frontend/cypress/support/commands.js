// Comandos Cypress reutilizables.

/**
 * Inicia sesión vía API directamente (no UI) — almacena el token en localStorage
 * para que la app cargue ya autenticada. Útil para pruebas que no se enfocan en login.
 */
Cypress.Commands.add('loginViaApi', (usuario, contrasena) => {
  return cy
    .request('POST', `${Cypress.env('apiUrl')}/auth/login`, { usuario, contrasena })
    .then((response) => {
      window.localStorage.setItem('sgp_token', response.body.token);
      window.localStorage.setItem('sgp_usuario', JSON.stringify(response.body.usuario));
      return response.body;
    });
});

/**
 * Login como administrador.
 */
Cypress.Commands.add('loginAdmin', () => {
  cy.loginViaApi(Cypress.env('adminUser'), Cypress.env('adminPass'));
});

/**
 * Login como secretaria.
 */
Cypress.Commands.add('loginSecretaria', () => {
  cy.loginViaApi(Cypress.env('secretariaUser'), Cypress.env('secretariaPass'));
});

/**
 * Registra un ingreso vía API directamente (precondición para pruebas de salida).
 */
Cypress.Commands.add('registrarIngreso', (placa) => {
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('sgp_token');
    return cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/ingresos`,
      headers: { Authorization: `Bearer ${token}` },
      body: { placa },
      failOnStatusCode: false,
    });
  });
});

/**
 * Cierra sesión limpiando el storage.
 */
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('sgp_token');
  window.localStorage.removeItem('sgp_usuario');
});

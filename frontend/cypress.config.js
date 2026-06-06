const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx}',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 8000,
    video: false,
    screenshotOnRunFailure: true,
    env: {
      apiUrl: 'http://localhost:4000/api',
      adminUser: 'admin',
      adminPass: 'admin123',
      secretariaUser: 'secretaria',
      secretariaPass: 'secre123',
    },
  },
});

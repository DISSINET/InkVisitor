// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

// Alternatively you can use CommonJS syntax:
// require('./commands')

declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      login(username: string, password: string): Chainable<any>;
    }
  }
}

Cypress.Commands.add("login", (username, password) => {
  cy.visit("http://localhost:8000/");

  cy.get("input[placeholder=username]").type(username);

  // {ctrl+enter} causes the form to submit
  cy.get("input[placeholder=password]").type(`${password}{ctrl+enter}`, {
    log: false,
  });

  // our auth cookie should be present
  // cy.getCookie("your-session-cookie").should("exist");

  // UI should reflect this user being logged in
  // cy.get('h1').should('contain', username)
});

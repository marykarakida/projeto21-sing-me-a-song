// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
Cypress.Commands.add('resetDatabase', () => {
    cy.request('POST', 'http://localhost:5000/e2e/reset', {});
});

Cypress.Commands.add('createRecommendation', (recommendation) => {
    cy.request('POST', 'http://localhost:5000/recommendations', recommendation).then(() => {});
});

Cypress.Commands.add('createAndDownvoteRecommendation', (recommendation) => {
    cy.request('POST', 'http://localhost:5000/recommendations', recommendation).then(() => {
        Array.from({ length: 5 }).forEach(() => {
            cy.request('POST', 'http://localhost:5000/recommendations/1/downvote', recommendation);
        });
    });
});

//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

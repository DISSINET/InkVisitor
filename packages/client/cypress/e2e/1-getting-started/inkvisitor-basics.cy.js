describe("InkVisitor main page", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8000/");
  });

  it("cy.window() - get the global window object", () => {
    cy.window().should("have.property", "top");
  });

  it("cy.document() - get the document object", () => {
    cy.document().should("have.property", "charset").and("eq", "UTF-8");
  });

  it("cy.title() - get the title", () => {
    cy.title().should("include", "InkVisitor");
  });

  it("login", () => {
    cy.login("admin", "admin");
    cy.contains("logged as").should("be.visible");
    cy.contains("admin").should("be.visible");
  });
});

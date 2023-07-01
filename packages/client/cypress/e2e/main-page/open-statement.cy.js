describe("open T", () => {
  beforeEach(() => {
    cy.login("admin", "admin");
  });

  it("opens territory", () => {
    cy.get("[data-cy=tree-node-0]").click();
    cy.get("[data-cy=statement-0]").click();
    cy.contains("Statement label").should("be.visible");
  });
});

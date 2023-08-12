describe("open T", () => {
  beforeEach(() => {
    cy.login("admin", "admin");
  });

  it("creates statement", () => {
    cy.get("[data-cy=tree-node-0]").click();
    cy.contains("new statement").click();
    const label = "test S";

    cy.get("[data-cy=Editor-box]").should("be.visible");
    cy.get("[data-cy=Editor-box]").contains("no label").should("be.visible");
  });
});

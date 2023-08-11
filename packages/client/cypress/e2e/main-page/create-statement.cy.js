describe("open T", () => {
  beforeEach(() => {
    cy.login("admin", "admin");
  });

  it("opens territory", () => {
    cy.get("[data-cy=tree-node-0]").click();
    cy.contains("new statement").click();
    const label = "test S";

    cy.get("[data-cy=Editor-box]").should("be.visible");
    cy.get("[data-cy=Editor-box]").contains("no label").should("be.visible");
  });
});

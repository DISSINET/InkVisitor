describe("open T", () => {
  beforeEach(() => {
    cy.login("admin", "admin");
  });

  it("adds child territory", () => {
    const label = "test child T";
    cy.get("[data-cy=tree-node").first().as("treenode");
    cy.get("@treenode")
      .find("[data-cy=territory-context-menu]")
      .trigger("mouseover")
      .find("button")
      .first()
      .click();
    cy.get("[data-cy=modal]").find("input").type(label);
    cy.contains("Save").click();
    cy.get("[data-cy=Territories-box]").contains(label).should("be.visible");
  });
});

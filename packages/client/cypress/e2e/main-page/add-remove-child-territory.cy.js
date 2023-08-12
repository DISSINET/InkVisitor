describe("open T", () => {
  beforeEach(() => {
    cy.login("admin", "admin");
  });

  it("adds and removes child territory", () => {
    const label = "test child T";
    cy.get("[data-cy=tree-node]").first().as("treenode");
    cy.get("@treenode")
      .find("[data-cy=territory-context-menu-trigger]")
      .trigger("mouseover");
    cy.get("#page")
      .find("[data-cy=territory-context-menu]")
      .find("button")
      .first()
      .click();

    // modal input
    cy.get("[data-cy=modal]").find("input").type(label);
    cy.contains("Save").click();
    cy.get("[data-cy=Territories-box]").contains(label).should("be.visible");

    // remove child
    cy.get("[data-cy=tree-node]")
      .last()
      .find("[data-cy=territory-context-menu-trigger]")
      .trigger("mouseover");
    cy.get("#page")
      .find("[data-cy=territory-context-menu]")
      .find("button")
      .last()
      .click();

    cy.contains("Submit").click();
    cy.get("[data-cy=Territories-box]").should("not.contain", label);
  });
});

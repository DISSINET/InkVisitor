describe("context menu", () => {
  beforeEach(() => {
    cy.login("admin", "admin");
  });

  it("creates T", () => {
    // TODO: create T only if not existing
    cy.contains("new territory").click();
    const label = "test T";
    cy.get("[data-cy=modal]").find("input").type(label);
    cy.contains("Save").click();

    cy.get("[data-cy=Territories-box]").contains(label).should("be.visible");
    cy.get("[data-cy=Statements-box]").contains(`T: ${label}`);
    cy.get("[data-cy=Detail-box]").contains(`${label}`);
  });

  it("adds child territory", () => {
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

    cy.get("[data-cy=modal]").find("input").type(label);
    cy.contains("Save").click();
    cy.get("[data-cy=Territories-box]").contains(label).should("be.visible");
  });

  it("removes child territory", () => {
    const label = "test child T";
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

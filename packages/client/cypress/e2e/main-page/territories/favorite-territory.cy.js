describe("context menu", () => {
  beforeEach(() => {
    cy.login("admin", "admin");
  });

  it("adds T, favorites T, removes from T favorites", () => {
    cy.contains("new territory").click();
    const rootLabel1 = "test T 1";
    cy.get("[data-cy=modal]").find("input").type(rootLabel1);
    cy.contains("Save").click();

    cy.contains("new territory").click();
    const rootLabel2 = "test T 2";
    cy.get("[data-cy=modal]").find("input").type(rootLabel2);
    cy.contains("Save").click();

    cy.get("[data-cy=tree-node]").as("treenode");
    cy.get("@treenode")
      .first()
      .find("[data-cy=territory-context-menu-trigger]")
      .trigger("mouseover");
    cy.get("#page")
      .find("[data-cy=territory-context-menu]")
      .find("button")
      .eq(1)
      .click();

    // TODO: check if T in tree is yellow color?

    // TODO: check if T has star in S list
    cy.get("@treenode")
      .first()
      .find("[data-cy=territory-context-menu-trigger]")
      .trigger("mouseover");
    cy.get("#page")
      .find("[data-cy=territory-context-menu]")
      .find("button")
      .eq(1)
      .click();

    // TODO: remove from favorites

    // REMOVE
    // cy.get("@treenode")
    //   .last()
    //   .find("[data-cy=territory-context-menu-trigger]")
    //   .trigger("mouseover");
    // cy.get("#page")
    //   .find("[data-cy=territory-context-menu]")
    //   .find("button")
    //   .last()
    //   .click();
    // cy.contains("Submit").click();
    // cy.get("[data-cy=Territories-box]").should("not.contain", label);
  });
});

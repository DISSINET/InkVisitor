describe("context menu", () => {
  beforeEach(() => {
    cy.login("admin", "admin");

    cy.contains("new territory").click();
    const rootLabel1 = "test T 1";
    cy.get("[data-cy=modal]").find("input").type(rootLabel1);
    cy.contains("Save").click();

    cy.contains("new territory").click();
    const rootLabel2 = "test T 2";
    cy.get("[data-cy=modal]").find("input").type(rootLabel2);
    cy.contains("Save").click();
  });

  after(() => {
    // REMOVE
    cy.get("@treenode")
      .last()
      .find("[data-cy=territory-context-menu-trigger]")
      .trigger("mouseover");
    cy.get("#page")
      .find("[data-cy=territory-context-menu]")
      .find("button")
      .last()
      .click();
    cy.contains("Submit").click();
    cy.get("@treenode")
      .first()
      .find("[data-cy=territory-context-menu-trigger]")
      .trigger("mouseover");
    cy.get("#page")
      .find("[data-cy=territory-context-menu]")
      .find("button")
      .last()
      .click();
    cy.contains("Submit").click();
  });

  it("adds T, favorites T, removes from T favorites", () => {
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

    // tag color check
    cy.window().then((win) => {
      const yellowColor = win.appTheme.color.warning;

      cy.get("[data-cy=tree-node]")
        .first()
        .find("[data-cy=tag-label]")
        .should("have.css", "background-color", yellowColor);
    });

    // TODO: check if T has star in S list?

    // remove from favorites
    cy.get("@treenode")
      .first()
      .find("[data-cy=territory-context-menu-trigger]")
      .trigger("mouseover");
    cy.get("#page")
      .find("[data-cy=territory-context-menu]")
      .find("button")
      .eq(1)
      .click();
  });
});

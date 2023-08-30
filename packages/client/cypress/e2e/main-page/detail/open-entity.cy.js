describe("open entity in detail - double click", () => {
  const rootLabel = "test T double click";

  beforeEach(() => {
    cy.login("admin", "admin");

    cy.contains("new territory").click();
    cy.get("[data-cy=modal]").find("input").type(rootLabel);
    cy.contains("Save").click();
  });

  after(() => {
    cy.get("[data-cy=tree-node]")
      .contains(rootLabel)
      .parents("[data-cy=tree-node]")
      .find("[data-cy=territory-context-menu-trigger]")
      .trigger("mouseover");
    cy.get("#page")
      .find("[data-cy=territory-context-menu]")
      .find("button")
      .eq(2)
      .click();
    cy.contains("Submit").click();
  });

  it("opens T (entity) in detail", () => {
    cy.get("[data-cy=tree-node]").contains(rootLabel).dblclick().blur();
  });
});
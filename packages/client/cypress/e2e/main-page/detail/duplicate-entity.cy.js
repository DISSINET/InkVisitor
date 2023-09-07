describe("open entity in detail - double click", () => {
  const rootLabel = "test T duplication";

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
    cy.get("[data-cy=Detail-box]")
      .find("[data-cy=actant-header-row]")
      .find("button")
      .eq(1)
      .click();

    cy.wait(200);

    // should be twice in tree and on detail tab
    cy.get("[data-cy=Territories-box]")
      .find("[data-cy=tag-label]")
      .filter(`:contains(${rootLabel})`)
      .should("have.length", 2);

    cy.get("[data-cy=Detail-box]")
      .find("[data-cy=detail-tab]")
      .filter(`:contains(${rootLabel})`)
      .should("have.length", 2);
  });
});

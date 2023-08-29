describe("open T", () => {
  const rootLabel1 = "test T 1";
  beforeEach(() => {
    cy.login("admin", "admin");

    cy.contains("new territory").click();
    cy.get("[data-cy=modal]").find("input").type(rootLabel1);
    cy.contains("Save").click();

    cy.get("[data-cy=Statements-box]").contains("new statement").click();
    cy.get("[data-cy=Statements-box]").find("table").find("tr").as("table-tr");
  });

  after(() => {
    cy.wait(200);

    cy.get("[data-cy=statement-list-tr]")
      .first()
      .find("[data-cy=statement-context-menu-trigger]")
      .trigger("mouseover");
    cy.get("[data-cy=statement-context-menu]").find("button").first().click();
    cy.contains("Submit").click();

    cy.wait(200);

    cy.get("[data-cy=statement-list-tr]")
      .first()
      .find("[data-cy=statement-context-menu-trigger]")
      .trigger("mouseover");
    cy.get("[data-cy=statement-context-menu]").find("button").first().click();
    cy.contains("Submit").click();

    cy.get("[data-cy=tree-node]")
      .contains(rootLabel1)
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

  it("duplicates statement", () => {
    cy.get("[data-cy=Statements-box]").find("tr").as("table-tr");
    cy.get("@table-tr").should("have.length", 1);

    cy.get("@table-tr")
      .find("[data-cy=statement-context-menu-trigger]")
      .trigger("mouseover");
    cy.get("[data-cy=statement-context-menu]").find("button").eq(1).click();

    cy.wait(200);

    cy.get("[data-cy=Statements-box]")
      .get("[data-cy=statement-list-tr]")
      .should("have.length", 2);
  });
});

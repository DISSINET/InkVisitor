// counts with T and S created
describe("open T", () => {
  beforeEach(() => {
    cy.login("admin", "admin");

    cy.contains("new territory").click();
    const rootLabel1 = "test T 1";
    cy.get("[data-cy=modal]").find("input").type(rootLabel1);
    cy.contains("Save").click();

    cy.get("[data-cy=Statements-box]").contains("new statement").click();
    cy.get("[data-cy=Statements-box]").find("table").find("tr").as("table-tr");
  });

  after(() => {
    cy.get("@table-tr")
      .find("[data-cy=statement-context-menu-trigger]")
      .trigger("mouseover");
    cy.get("[data-cy=statement-context-menu]").find("button").first().click();
    cy.contains("Submit").click();

    cy.get("[data-cy=tree-node]")
      .first()
      .find("[data-cy=territory-context-menu-trigger]")
      .trigger("mouseover");
    cy.get("#page")
      .find("[data-cy=territory-context-menu]")
      .find("button")
      .eq(2)
      .click();
    cy.contains("Submit").click();
  });

  it("opens statement", () => {
    cy.get("[data-cy=Statements-box]").find("tr").as("table-tr");
    cy.get("@table-tr").first().click();
    cy.get("[data-cy=Editor-box]").contains("no label").should("be.visible");
  });
});

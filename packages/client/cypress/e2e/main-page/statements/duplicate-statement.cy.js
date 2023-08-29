describe("open T", () => {
  const rootLabel1 = "test T 1";
  const statementLabel = "test statement label";
  const statementText =
    "Exercitation anim chuck, brisket landjaeger quis flank short ribs salami sirloin. Cupidatat chuck ut, mollit spare ribs proident ground round filet mignon ut elit minim excepteur exercitation. Pork commodo irure sunt fugiat beef, ut quis buffalo cupim ham beef ribs ea ham hock excepteur. Leberkas exercitation spare ribs cupim minim tempor. In pork chop proident consequat ham.";

  beforeEach(() => {
    cy.login("admin", "admin");

    cy.contains("new territory").click();
    cy.get("[data-cy=modal]").find("input").type(rootLabel1);
    cy.contains("Save").click();

    cy.get("[data-cy=Statements-box]").contains("new statement").click();
    cy.get("[data-cy=Statements-box]").find("table").find("tr").as("table-tr");

    cy.get("[data-cy=Editor-box]")
      .contains("change statement label")
      .parent()
      .find("input")
      .type(statementLabel)
      .blur();

    cy.get("[data-cy=Editor-box]")
      .find("textarea")
      .first()
      .type(statementText)
      .blur();
  });

  after(() => {
    cy.wait(200);

    cy.get("@table-tr")
      .first()
      .find("[data-cy=statement-context-menu-trigger]")
      .trigger("mouseover");
    cy.get("[data-cy=statement-context-menu]").find("button").first().click();
    cy.contains("Submit").click();

    cy.wait(200);

    cy.get("@table-tr")
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
    cy.get("[data-cy=Statements-box]")
      .find("[data-cy=statement-list-tr]")
      .as("table-tr");
    cy.get("@table-tr").should("have.length", 1);

    cy.get("@table-tr")
      .find("[data-cy=statement-context-menu-trigger]")
      .trigger("mouseover");
    cy.get("[data-cy=statement-context-menu]").find("button").eq(1).click();

    cy.wait(200);

    cy.get("[data-cy=Statements-box]")
      .get("[data-cy=statement-list-tr]")
      .should("have.length", 2);

    cy.get("[data-cy=Editor-box]")
      .contains("change statement label")
      .parent()
      .find("input")
      .invoke("val")
      .should("eq", statementLabel);

    cy.get("[data-cy=Editor-box]")
      .find("textarea")
      .first()
      .invoke("val")
      .should("eq", statementText);
  });
});

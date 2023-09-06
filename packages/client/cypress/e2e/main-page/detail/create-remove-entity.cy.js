describe("create entity", () => {
  const territoryLabel = "test T";
  beforeEach(() => {
    cy.login("admin", "admin");
  });

  it("creates entity from detail", () => {
    cy.contains("new territory").click();
    cy.get("[data-cy=modal]").find("input").type(territoryLabel);
    cy.contains("Save").click();

    const label = "Action";
    const detailText = "detail text";
    const language = "Latin";

    cy.contains("new entity").click();
    cy.get("[data-cy=modal]").find(".react-select__control").first().click();
    cy.get(".react-select__option").contains("A").click();
    cy.get("[data-cy=modal]").find("input").eq(1).type(label);
    cy.get("[data-cy=modal]").find("input").eq(2).type(detailText);
    cy.get("[data-cy=modal]").find(".react-select__control").last().click();
    cy.get(".react-select__option").contains(language).click();
    cy.get("button").contains("Create").click();

    cy.get("[data-cy=Detail-box]").contains(`${label}`);
    cy.get("[data-cy=Detail-box]").contains(`${detailText}`);
    cy.get("[data-cy=Detail-box]").contains(`${language}`);

    cy.get("[data-cy=Detail-box]")
      .find("[data-cy=actant-header-row]")
      .find("button")
      .first()
      .click();
    cy.get("[data-cy=modal]").get("button").contains("Remove").click();

    cy.get("[data-cy=Detail-box]")
      .find("[data-cy=actant-header-row]")
      .find("button")
      .first()
      .click();
    cy.get("[data-cy=modal]").get("button").contains("Remove").click();

    cy.get("[data-cy=Territories-box]").should("not.contain", territoryLabel);
  });
});

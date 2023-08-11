// counts with T and S created
describe("open T", () => {
  beforeEach(() => {
    cy.login("admin", "admin");
  });

  it("opens statement", () => {
    cy.get("[data-cy=tree-node-0-lvl-1]").click("left");
    cy.get("[id=Statements-box-table]")
      .find("tbody")
      .find("tr")
      .first()
      .click();
    // cy.contains("Statement label").should("be.visible");
  });
});

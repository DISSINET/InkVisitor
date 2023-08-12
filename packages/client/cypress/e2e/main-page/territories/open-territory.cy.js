// counts with T created
describe("open T", () => {
  beforeEach(() => {
    cy.login("admin", "admin");
  });

  it("opens territory", () => {
    cy.get("[data-cy=tree-node").first().as("treenode");
    cy.get("@treenode").click("left");
    cy.get("@treenode")
      .find("[data-cy=tag-label]")
      .invoke("text")
      .then((elementLabel) => {
        cy.get("[data-cy=Statements-box]")
          .contains(`T: ${elementLabel}`)
          .should("be.visible");
      });
  });
});

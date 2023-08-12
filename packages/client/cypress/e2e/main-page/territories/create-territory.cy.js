describe("open T", () => {
  beforeEach(() => {
    cy.login("admin", "admin");
  });

  it("creates territory", () => {
    cy.contains("new territory").click();
    const label = "test T";
    cy.get("[data-cy=modal]").find("input").type(label);
    cy.contains("Save").click();

    cy.get("[data-cy=Territories-box]").contains(label).should("be.visible");
    cy.get("[data-cy=Statements-box]").contains(`T: ${label}`);
    cy.get("[data-cy=Detail-box]").contains(`${label}`);
  });
});

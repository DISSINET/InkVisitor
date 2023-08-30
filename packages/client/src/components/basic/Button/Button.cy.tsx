import React from "react";
import { Button } from "./Button";

describe("<Button />", () => {
  it("renders", () => {
    cy.mount(<Button label="test" color="danger" />);
    cy.get("button").should("exist");
    cy.contains("button", "test").should("exist");
  });
  it("label should exist", () => {
    const buttonText = "Click Me";
    cy.mount(<Button label={buttonText} color="danger" />);
    cy.contains("button", buttonText).should("exist");
  });

  it("should call the onClick handler when clicked", () => {
    cy.mount(
      <Button label="button" color="danger" onClick={cy.stub().as("click")} />
    );
    cy.get("button").click();
    cy.get("@click").should("have.been.calledOnce");
  });

  it("does not call the handler on the disabled button", () => {
    cy.mount(<Button label="T" disabled onClick={cy.stub().as("click")} />);
    cy.get("button").click({ force: true });
    cy.get("button").should("be.disabled");
    cy.get("@click").should("not.have.been.called");
  });
});
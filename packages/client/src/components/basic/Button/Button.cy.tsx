import React from "react";
import { Button } from "./Button";

describe("<Button />", () => {
  it("renders", () => {
    cy.mount(<Button label="test" color="danger" />);
    cy.get("button").should("exist");
  });
  it("label should exist", () => {
    const buttonText = "Click Me";
    cy.mount(<Button label={buttonText} color="danger" />);
    cy.contains("button", buttonText).should("exist");
  });

  it("should call the onClick handler when clicked", () => {
    const onClick = cy.stub();

    cy.mount(<Button label="button" onClick={onClick} color="danger" />);
    cy.get("button").click();

    expect(onClick).to.be.calledOnce;
  });

  it("should be disabled when the disabled prop is provided", () => {
    cy.mount(<Button label="T" disabled />);
    cy.get("button").should("be.disabled");
  });
});

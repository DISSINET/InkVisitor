import React from "react";
import { Button } from "./Button";

describe("<Button />", () => {
  // beforeEach(() => {
  //   cy.viewport(500, 500);
  // });
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<Button label="test" color="danger" />);
  });
});

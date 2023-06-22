import React from "react";
import { AttributeIcon } from "./AttributeIcon";

describe("<AttributeIcon />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<AttributeIcon attributeName="mood" />);
  });
});

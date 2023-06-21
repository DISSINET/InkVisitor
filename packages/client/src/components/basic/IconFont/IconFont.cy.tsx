import React from "react";
import { IconFont } from "./IconFont";

describe("<IconFont />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<IconFont letter="X" />);
  });
});

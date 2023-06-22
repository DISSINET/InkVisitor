import React from "react";
import { EmptyTag } from "./EmptyTag";

describe("<EmptyTag />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<EmptyTag label="lorem ipsum" />);
  });
});

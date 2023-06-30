import React from "react";
import { AttributeIcon } from "./AttributeIcon";

describe("<AttributeIcon />", () => {
  it("renders", () => {
    cy.mount(<AttributeIcon attributeName="mood" />);
    cy.get("[data-cy=attribute-icon]").should("exist");
  });
});

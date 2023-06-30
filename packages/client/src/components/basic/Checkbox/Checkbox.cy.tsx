import React from "react";
import { Checkbox } from "./Checkbox";

describe("<Checkbox />", () => {
  it("renders", () => {
    cy.mount(<Checkbox size={500} value={false} onChangeFn={(value) => {}} />);
    cy.get("[data-cy=checkbox]").should("exist");
  });
});

import React from "react";
import { Checkbox } from "./Checkbox";

describe("<Checkbox />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<Checkbox value={false} onChangeFn={(value) => {}} />);
  });
});

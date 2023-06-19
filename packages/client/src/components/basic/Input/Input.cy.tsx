import React from "react";
import { Input } from "./Input";

describe("<Input />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<Input onChangeFn={(v: string) => {}} />);
  });
});

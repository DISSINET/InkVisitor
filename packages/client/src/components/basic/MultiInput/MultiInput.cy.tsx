import React from "react";
import { MultiInput } from "./MultiInput";

describe("<MultiInput />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(
      <MultiInput
        onChange={(values) => {}}
        values={["lorem ipsum", "generator"]}
      />
    );
  });
});

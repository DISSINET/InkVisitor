import React from "react";
import { Cloud } from "./Cloud";

describe("<Cloud />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(
      <Cloud onUnlink={() => {}}>
        <p>{"cloud of entities"}</p>
      </Cloud>
    );
  });
});

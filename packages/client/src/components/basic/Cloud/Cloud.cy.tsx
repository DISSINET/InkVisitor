import React from "react";
import { Cloud } from "./Cloud";

describe("<Cloud />", () => {
  it("renders", () => {
    cy.mount(
      <Cloud onUnlink={() => {}}>
        <p>{"cloud of entities"}</p>
      </Cloud>
    );
    cy.get("[data-cy=cloud]").should("exist");
  });
});

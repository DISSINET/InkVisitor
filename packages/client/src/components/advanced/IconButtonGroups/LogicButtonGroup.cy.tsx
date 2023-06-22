import React from "react";
import { LogicButtonGroup } from "./LogicButtonGroup";
import { EntityEnums } from "@shared/enums";

describe("<LogicButtonGroup />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(
      <LogicButtonGroup
        value={EntityEnums.Logic.Positive}
        onChange={(logic) => {}}
      />
    );
  });
});

import React from "react";
import { PositionButtonGroup } from "./PositionButtonGroup";
import { EntityEnums } from "@shared/enums";

describe("<PositionButtonGroup />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(
      <PositionButtonGroup
        value={EntityEnums.Position.Actant1}
        onChange={(position) => {}}
      />
    );
  });
});

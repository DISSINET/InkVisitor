import React from "react";
import { ElvlButtonGroup } from "./ElvlButtonGroup";
import { EntityEnums } from "@shared/enums";

describe("<ElvlButtonGroup />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(
      <ElvlButtonGroup
        value={EntityEnums.Elvl.Interpretive}
        onChange={(elvl) => {}}
      />
    );
  });
});

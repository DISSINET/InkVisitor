import React from "react";
import { EntitySuggester } from "./EntitySuggester";
import { EntityEnums } from "@shared/enums";

describe("<EntitySuggester />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(
      <EntitySuggester
        categoryTypes={[EntityEnums.Class.Action]}
        onSelected={() => {}}
      />
    );
  });
});

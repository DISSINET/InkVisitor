import React from "react";
import { MoodVariantButtonGroup } from "./MoodVariantButtonGroup";
import { EntityEnums } from "@shared/enums";

describe("<MoodVariantButtonGroup />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(
      <MoodVariantButtonGroup
        value={EntityEnums.MoodVariant.Realis}
        onChange={(moodvariant) => {}}
      />
    );
  });
});

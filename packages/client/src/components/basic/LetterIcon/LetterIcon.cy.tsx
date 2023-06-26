import React from "react";
import { LetterIcon } from "./LetterIcon";
import { RelationEnums } from "@shared/enums";

describe("<LetterIcon />", () => {
  it("renders", () => {
    cy.mount(
      <LetterIcon
        color="success"
        letter={RelationEnums.Type.Actant1Semantics}
      />
    );
  });
});

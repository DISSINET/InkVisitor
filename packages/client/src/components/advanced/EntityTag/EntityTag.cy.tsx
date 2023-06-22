import React from "react";
import { EntityTag } from "./EntityTag";
import { EntityEnums } from "@shared/enums";
import { CEntity } from "constructors";

describe("<EntityTag />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    const entity = CEntity(
      {
        defaultTerritory: "T0",
        defaultLanguage: EntityEnums.Language.Czech,
        searchLanguages: [],
      },
      EntityEnums.Class.Territory,
      "xxx"
    );
    cy.mount(
      <EntityTag entity={entity} unlinkButton={{ onClick: () => {} }} />
    );
  });
});

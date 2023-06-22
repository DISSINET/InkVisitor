import { entityStatusDict } from "@shared/dictionaries";
import { EntityEnums } from "@shared/enums";
import React from "react";
import { AttributeButtonGroup } from "./AttributeButtonGroup";

describe("<AttributeButtonGroup />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(
      <AttributeButtonGroup
        options={entityStatusDict.map((entityStatusOption) => {
          return {
            longValue: entityStatusOption["label"],
            shortValue: entityStatusOption["label"],
            onClick: () => {},
            selected:
              entityStatusOption["value"] === EntityEnums.Status.Approved,
          };
        })}
      />
    );
  });
});

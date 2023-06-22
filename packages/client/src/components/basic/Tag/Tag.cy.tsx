import React from "react";
import { Tag } from "./Tag";
import { EntityEnums } from "@shared/enums";

describe("<Tag />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(
      <Tag
        propId="abc"
        entityClass={EntityEnums.Class.Object}
        label="testing"
      />
    );
  });
});

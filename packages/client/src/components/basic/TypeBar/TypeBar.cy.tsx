import React from "react";
import { TypeBar } from "./TypeBar";
import { EntityEnums } from "@shared/enums";

describe("<TypeBar />", () => {
  it("renders", () => {
    cy.mount(<TypeBar entityClass={EntityEnums.Class.Object} />);
  });
});

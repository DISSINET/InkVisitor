import React from "react";
import { Dropdown } from "./Dropdown";

// TODO: multi, attributeDropdown

describe("<Dropdown />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(
      <Dropdown
        width={120}
        onChange={(selectedOption) => {}}
        options={[
          { label: "option 1", value: "1" },
          { label: "option 2", value: "2" },
        ]}
      />
    );
  });
});

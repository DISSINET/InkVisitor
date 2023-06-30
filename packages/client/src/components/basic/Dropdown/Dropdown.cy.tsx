import React from "react";
import { Dropdown } from "./Dropdown";

// TODO: multi, attributeDropdown

describe("<Dropdown />", () => {
  it("renders", () => {
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
    cy.get("[data-cy=dropdown]").should("exist");
  });
});

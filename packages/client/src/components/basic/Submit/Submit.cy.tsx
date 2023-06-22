import React from "react";
import { Submit } from "./Submit";

describe("<Submit />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(
      <Submit
        title="Submit modal"
        submitLabel="Submit"
        text="Do you really want to submit?"
        show
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    );
  });
});

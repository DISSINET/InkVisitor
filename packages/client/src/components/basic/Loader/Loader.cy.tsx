import React from "react";
import { Loader } from "./Loader";

describe("<Loader />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(
      <div style={{ height: "100vh", width: "100%", position: "relative" }}>
        <Loader show />
      </div>
    );
  });
});

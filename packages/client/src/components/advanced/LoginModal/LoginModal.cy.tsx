import React from "react";
import { LoginModal } from "./LoginModal";

describe("<LoginModal />", () => {
  it("renders", () => {
    cy.mount(<LoginModal />);
  });
});

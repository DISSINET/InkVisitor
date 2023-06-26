import React from "react";
import { TemplateActionModal } from "./TemplateActionModal";

describe("<TemplateActionModal />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(
      <TemplateActionModal
        onClose={() => {}}
        onUse={() => {}}
        onInstantiate={() => {}}
      />
    );
  });
});

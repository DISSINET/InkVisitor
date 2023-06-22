import React from "react";
import { BundleButtonGroup } from "./BundleButtonGroup";

describe("<BundleButtonGroup />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(
      <BundleButtonGroup
        bundleStart={false}
        onBundleStartChange={(bundleStart) => {}}
        bundleEnd={true}
        onBundleEndChange={(bundleStart) => {}}
      />
    );
  });
});

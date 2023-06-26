import React from "react";
import { Dropzone } from "./Dropzone";

// Invisible zone under tags for replacing them
describe("<Dropzone />", () => {
  it("renders", () => {
    cy.mount(
      <Dropzone onDrop={() => {}} onHover={() => {}} isInsideTemplate={false}>
        <p>{"drop here"}</p>
      </Dropzone>
    );
  });
});

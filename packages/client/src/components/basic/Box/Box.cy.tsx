import React from "react";
import { Box } from "./Box";

describe("<Box />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(
      <Box height={300} label="Test box" color="danger">
        <p>
          Occaecat hamburger officia, buffalo tri-tip andouille short ribs
          fugiat tempor do spare ribs ad. Shoulder est aliqua, ham hock officia
          reprehenderit excepteur culpa strip steak voluptate fatback jowl
          ground round ut. Pastrami bresaola turducken meatloaf. Tri-tip
          frankfurter kielbasa rump velit deserunt aute ham kevin elit officia
          aliqua eiusmod. Tri-tip strip steak ribeye, in swine chicken dolor
          biltong culpa velit cupim leberkas nostrud. Culpa chicken deserunt
          flank t-bone.
        </p>
      </Box>
    );
  });
});

import React from "react";
import { Box } from "./Box";

describe("<Box />", () => {
  it("renders", () => {
    const title = "Test box";
    const text =
      "Occaecat hamburger officia, buffalo tri-tip andouille short ribs fugiat tempor do spare ribs ad. Shoulder est aliqua, ham hock officia reprehenderit excepteur culpa strip steak voluptate fatback jowl ground round ut. Pastrami bresaola turducken meatloaf. Tri-tip frankfurter kielbasa rump velit deserunt aute ham kevin elit officia aliqua eiusmod. Tri-tip strip steak ribeye, in swine chicken dolor biltong culpa velit cupim leberkas nostrud. Culpa chicken deserunt flank t-bone.";
    cy.mount(
      <Box height={300} label={title} color="danger">
        <p>{text}</p>
      </Box>
    );
    cy.get("[data-cy=box]").should("exist");
    cy.contains("[data-cy=box]", title).should("exist");
    cy.contains("[data-cy=box]", text).should("exist");
  });
});

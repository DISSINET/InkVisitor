import React from "react";
import { Input } from "./Input";

describe("<Input />", () => {
  // type: TEXT
  it("renders", () => {
    cy.mount(<Input onChangeFn={(v: string) => {}} />);
  });
  it("should allow entering text into the text input field", () => {
    cy.mount(<Input onChangeFn={(v: string) => {}} />);
    const inputText = "test text";
    cy.get("input[type='text']").type(inputText);
    cy.get("input[type='text']").should("have.value", inputText);
  });
  it("should clear the text input field", () => {
    const inputText = "test text";
    cy.mount(<Input onChangeFn={(v: string) => {}} />);
    cy.get("input[type='text']").type(inputText);
    cy.get("input[type='text']").clear();
    cy.get("input[type='text']").should("have.value", "");
  });

  // type: TEXTAREA
  it("renders", () => {
    cy.mount(<Input type="textarea" onChangeFn={(v: string) => {}} />);
  });
  it("should allow entering text into the textarea input field", () => {
    cy.mount(<Input type="textarea" onChangeFn={(v: string) => {}} />);
    const inputText = "test text";
    cy.get("textarea").type(inputText);
    cy.get("textarea").should("have.value", inputText);
  });
  it("should clear the textarea input field", () => {
    const inputText = "test text";
    cy.mount(<Input type="textarea" onChangeFn={(v: string) => {}} />);
    cy.get("textarea").type(inputText);
    cy.get("textarea").clear();
    cy.get("textarea").should("have.value", "");
  });
});

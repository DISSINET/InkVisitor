import { rolesShareAConcept } from "@inkvisitor/shared/types/geocoding";
import { describe, expect, it } from "vitest";

/**
 * The coordinate roles are told apart by their Concept: with one Concept in two
 * of them, the geometry prop and the accuracy under it cannot be told apart.
 */
describe("rolesShareAConcept", () => {
  const roles = { geometry: "c-geo", accuracy: "c-acc", epistemicSource: "c-source" };

  it("is false for three different Concepts", () => {
    expect(rolesShareAConcept(roles)).toBe(false);
  });

  it.each([
    ["the geometry and the accuracy", { accuracy: "c-geo" }],
    ["the geometry and the source", { epistemicSource: "c-geo" }],
    ["the accuracy and the source", { epistemicSource: "c-acc" }],
  ])("is true for one Concept in %s", (_name, clash) => {
    expect(rolesShareAConcept({ ...roles, ...clash })).toBe(true);
  });

  it("does not count roles nobody has assigned yet as sharing one", () => {
    expect(rolesShareAConcept({ geometry: "", accuracy: "", epistemicSource: "" })).toBe(false);
    expect(rolesShareAConcept({ ...roles, epistemicSource: "" })).toBe(false);
  });
});

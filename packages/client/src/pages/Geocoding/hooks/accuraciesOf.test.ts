import { IResponseEntity } from "@inkvisitor/shared/types";
import { describe, expect, it } from "vitest";
import { accuraciesOf } from "./accuraciesContext";

const concept = (id: string, label: string, detail = ""): IResponseEntity =>
  ({ id, labels: [label], detail }) as IResponseEntity;

const roles = {
  accuracy: "c-role",
  accuracies: ["c-street", "", "c-gone"],
  accuracyWhenAgree: "c-street",
  accuracyWhenScattered: "c-gone",
};

describe("accuraciesOf", () => {
  const read = accuraciesOf(roles, [
    concept("c-street", "to the street", "The point is the place."),
    concept("c-role", "geo:accuracy"),
    concept("c-elsewhere", "roughly"),
  ]);

  it("lists the accuracies with a Concept, in their order, with each Concept's label and detail", () => {
    expect(read.entries.map(({ conceptId, label, detail }) => [conceptId, label, detail])).toEqual([
      ["c-street", "to the street", "The point is the place."],
      ["c-gone", "", ""],
    ]);
  });

  it("calls a listed accuracy by its label, and one that cannot be read never 'not in the list'", () => {
    expect(read.labelOf("c-street")).toBe("to the street");
    expect(read.labelOf("c-gone")).toBe("an accuracy whose Concept cannot be read");
    expect(read.labelOf("c-elsewhere")).toBe("an accuracy not in the project's list");
    expect(read.labelOf(null)).toBe("");
  });

  it("calls a listed accuracy nothing while its Concept is still being read, so no name taken then says it cannot be read", () => {
    const loading = accuraciesOf(roles, [], true);
    expect(loading.labelOf("c-street")).toBe("");
    expect(loading.labelOf("c-elsewhere")).toBe("an accuracy not in the project's list");
  });

  it("carries the marks and the Concept the accuracy is recorded under", () => {
    expect(read.whenAgree).toBe("c-street");
    expect(read.whenScattered).toBe("c-gone");
    expect(read.roleConcept?.labels[0]).toBe("geo:accuracy");
    expect(accuraciesOf({ ...roles, accuracy: "" }, [concept("c-role", "x")]).roleConcept).toBeUndefined();
  });
});

import { defaultPlaceTypes } from "@inkvisitor/shared/types/geocoding";
import { expandPlaceTypes } from "../../utils/context/placeTypeHierarchy";
import { describe, expect, it } from "vitest";
import { LocationTypeEntry } from "../../hooks/usePlaceTypeAssignments";
import { defaultTypeFor, describeEntries, describeEntry, shownEntries } from "./locationTypeText";

const types = expandPlaceTypes(
  defaultPlaceTypes().map((one) => ({ ...one, conceptId: `c-${one.id}` })),
  {},
  {}
);
const entry = (typeId: string, over: Partial<LocationTypeEntry> = {}): LocationTypeEntry => ({
  typeId,
  inferred: false,
  via: `c-${typeId}`,
  shadowed: false,
  underNode: false,
  ...over,
});
const label = (conceptId: string) => (conceptId === "c-city" ? "city" : "another Concept");

describe("describeEntry", () => {
  it("says only the name of a location type the Location is classified under", () => {
    expect(describeEntry(entry("settlement"), types, label)).toBe("settlement");
  });

  it("says that a deactivated location type the Location still has is not offered for a new assignment", () => {
    const off = types.map((one) => (one.id === "settlement" ? { ...one, active: false } : one));
    expect(describeEntry(entry("settlement"), off, label)).toBe(
      "settlement (deactivated for new assignments)"
    );
  });

  it("says where an inferred one comes from", () => {
    expect(describeEntry(entry("settlement", { inferred: true, via: "c-city" }), types, label)).toBe(
      "settlement — inferred from city",
    );
  });
});

describe("describeEntries", () => {
  it("lists every shown location type, one to a line", () => {
    const text = describeEntries(
      [entry("fortress"), entry("settlement", { inferred: true, via: "c-city" })],
      types,
      label,
    );
    expect(text).toBe("fortress\nsettlement — inferred from city");
  });

  it("joins them with the separator given, for a card that has one line for them", () => {
    const text = describeEntries(
      [entry("fortress"), entry("settlement", { inferred: true, via: "c-city" })],
      types,
      label,
      ", ",
    );
    expect(text).toBe("fortress, settlement — inferred from city");
  });

  it("leaves out a type that another lies below, which is not shown", () => {
    const entries = [entry("fortress"), entry("settlement", { shadowed: true })];
    expect(shownEntries(entries).map((one) => one.typeId)).toEqual(["fortress"]);
    expect(describeEntries(entries, types, label)).toBe("fortress");
  });

  it("says that nothing is recorded where nothing is shown", () => {
    expect(describeEntries([], types, label)).toBe("location type not recorded");
    expect(describeEntries([entry("settlement", { shadowed: true })], types, label)).toBe(
      "location type not recorded",
    );
  });
});

describe("defaultTypeFor", () => {
  const corpus = { recordPlaceType: false, defaultPlaceType: "settlement" };

  it("is the corpus-wide location type for a Location that has none", () => {
    expect(defaultTypeFor(corpus, [], types)).toBe("settlement");
  });

  it("is none where the Location is classified under the type's Concept already", () => {
    expect(defaultTypeFor(corpus, [entry("settlement")], types)).toBeUndefined();
  });

  it("is none where the Location only comes under the type through a subclass", () => {
    expect(
      defaultTypeFor(corpus, [entry("settlement", { inferred: true, via: "c-city" })], types),
    ).toBeUndefined();
  });

  it("is none where a narrower type shadows it, since the Location still comes under it", () => {
    expect(defaultTypeFor(corpus, [entry("settlement", { shadowed: true })], types)).toBeUndefined();
  });

  it("is still the corpus-wide type for a Location that has a different one", () => {
    expect(defaultTypeFor(corpus, [entry("fortress")], types)).toBe("settlement");
  });

  it("is none where the project has since deactivated the type it named, read from the tree or the stored list", () => {
    const stored = defaultPlaceTypes().map((one) => ({
      ...one,
      conceptId: `c-${one.id}`,
      inactive: one.id === "settlement" ? ["c-settlement"] : [],
    }));
    expect(defaultTypeFor(corpus, [], expandPlaceTypes(stored, {}, {}))).toBeUndefined();
    expect(defaultTypeFor(corpus, [], stored)).toBeUndefined();
  });

  it("is none where the project asks for the location type each time, or named none", () => {
    expect(defaultTypeFor({ recordPlaceType: true, defaultPlaceType: "settlement" }, [], types)).toBeUndefined();
    expect(defaultTypeFor({ recordPlaceType: false, defaultPlaceType: null }, [], types)).toBeUndefined();
  });
});

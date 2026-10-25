import { defaultPlaceTypes } from "@inkvisitor/shared/types/geocoding";
import { describe, expect, it } from "vitest";
import { LocationTypeEntry } from "../../hooks/usePlaceTypeAssignments";
import { describeEntries, describeEntry, shownEntries } from "./locationTypeText";

const types = defaultPlaceTypes().map((one) => ({ ...one, conceptId: `c-${one.id}` }));
const entry = (typeId: string, over: Partial<LocationTypeEntry> = {}): LocationTypeEntry => ({
  typeId,
  inferred: false,
  via: `c-${typeId}`,
  shadowed: false,
  ...over,
});
const label = (conceptId: string) => (conceptId === "c-city" ? "city" : "another Concept");

describe("describeEntry", () => {
  it("says only the name of a location type the Location is classified under", () => {
    expect(describeEntry(entry("settlement"), types, label)).toBe("settlement");
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

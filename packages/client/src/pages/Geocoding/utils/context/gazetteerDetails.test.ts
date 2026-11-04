import { describe, expect, it } from "vitest";
import {
  categoryLabel,
  coverageGroups,
  languageName,
  licenceChips,
  placeTypeName,
  sizeSentence,
  slugLabel,
  weightSentence,
} from "./gazetteerDetails";

describe("coverageGroups", () => {
  it("turns slugs, language codes and engine types into words", () => {
    const groups = coverageGroups({
      regions: ["low-countries"],
      periods: ["late-medieval"],
      languages: ["de"],
      placeTypes: ["religious"],
    });
    expect(groups).toEqual([
      { title: "regions", items: ["low countries"] },
      { title: "periods", items: ["late medieval"] },
      { title: "languages", items: ["German"] },
      { title: "kinds of place", items: ["religious house"] },
    ]);
  });

  it("leaves out a dimension the source declares nothing for", () => {
    expect(coverageGroups({ placeTypes: ["port"] }).map((group) => group.title)).toEqual([
      "kinds of place",
    ]);
    expect(coverageGroups({})).toEqual([]);
  });
});

describe("words for codes", () => {
  it("falls back to the code for a language the runtime cannot name", () => {
    expect(languageName("not a language code!")).toBe("not a language code!");
  });

  it("names an engine place type the way the page does, and an unknown one by its slug", () => {
    expect(placeTypeName("archaeological")).toBe("archaeological site");
    expect(placeTypeName("sacred-grove")).toBe("sacred grove");
    expect(slugLabel("holy_roman-empire")).toBe("holy roman empire");
  });
});

describe("licenceChips", () => {
  const base = {
    id: "x",
    label: "CC BY-SA 4.0",
    commercialUse: "yes" as const,
    shareAlike: true,
    attribution: true,
  };

  it("says what the licence allows and what it asks", () => {
    expect(licenceChips(base).map((chip) => chip.label)).toEqual([
      "CC BY-SA 4.0",
      "commercial use allowed",
      "credit required",
      "share-alike",
    ]);
  });

  it("marks a non-commercial licence as a warning rather than a plain label", () => {
    const chips = licenceChips({ ...base, commercialUse: "no", shareAlike: false });
    expect(chips.find((chip) => chip.label === "non-commercial only")?.tone).toBe("bad");
  });

  it("asks for the terms to be checked where the engine is not sure", () => {
    const chips = licenceChips({ ...base, commercialUse: "verify", attribution: false });
    expect(chips.find((chip) => chip.tone === "caution")?.label).toContain("check the terms");
    expect(chips.map((chip) => chip.label)).not.toContain("credit required");
  });
});

describe("sizeSentence and weightSentence", () => {
  it("states a measured size in full, with the exact figures", () => {
    expect(sizeSentence({ records: 621528, cells: 340 })).toContain("621,528 records");
  });

  it("says an online source is not measured rather than showing zero", () => {
    expect(sizeSentence(null)).toContain("not measured");
  });

  it("says the weight cannot be changed where the floor is the default", () => {
    expect(weightSentence({ default: 0.35, min: 0.35 })).toContain("cannot be changed");
    expect(weightSentence({ default: 0.85, min: 0.5 })).toContain("lower it to 0.5");
  });
});

describe("categoryLabel", () => {
  it("separates local records from online services", () => {
    expect(categoryLabel("file")).toBe("local records");
    expect(categoryLabel("service")).toBe("online service");
  });
});

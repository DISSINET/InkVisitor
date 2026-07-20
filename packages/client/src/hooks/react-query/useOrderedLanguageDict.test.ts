import { languageDict, orderLanguageDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { describe, it, expect } from "vitest";

describe("orderLanguageDict", () => {
  it("keeps the empty option pinned first", () => {
    const result = orderLanguageDict([EntityEnums.Language.German]);
    expect(result[0].value).toBe(EntityEnums.Language.Empty);
  });

  it("promotes working languages right after empty, in languageDict order", () => {
    // pass them in reverse dict order to prove the result follows dict order, not input order
    const result = orderLanguageDict([
      EntityEnums.Language.German,
      EntityEnums.Language.Czech,
    ]);
    const values = result.map((i) => i.value);
    // Czech precedes German in languageDict (basicLanguages), so it must rank first
    expect(values.slice(0, 3)).toEqual([
      EntityEnums.Language.Empty,
      EntityEnums.Language.Czech,
      EntityEnums.Language.German,
    ]);
  });

  it("keeps the non-working remainder in original languageDict order", () => {
    const result = orderLanguageDict([EntityEnums.Language.German]);
    const rest = result
      .filter(
        (i) =>
          i.value !== EntityEnums.Language.Empty &&
          i.value !== EntityEnums.Language.German,
      )
      .map((i) => i.value);
    const expected = languageDict
      .filter(
        (i) =>
          i.value !== EntityEnums.Language.Empty &&
          i.value !== EntityEnums.Language.German,
      )
      .map((i) => i.value);
    expect(rest).toEqual(expected);
  });

  it("ignores unknown and duplicate working values and never double-lists", () => {
    const result = orderLanguageDict([
      EntityEnums.Language.German,
      EntityEnums.Language.German,
      "xx-not-a-language" as EntityEnums.Language,
      EntityEnums.Language.Empty,
    ]);
    expect(result).toHaveLength(languageDict.length);
    const germanCount = result.filter(
      (i) => i.value === EntityEnums.Language.German,
    ).length;
    expect(germanCount).toBe(1);
  });

  it("returns empty first then the plain dict remainder when no working languages are set", () => {
    const result = orderLanguageDict([]);
    const values = result.map((i) => i.value);
    expect(values[0]).toBe(EntityEnums.Language.Empty);
    expect(values.slice(1)).toEqual(
      languageDict
        .filter((i) => i.value !== EntityEnums.Language.Empty)
        .map((i) => i.value),
    );
  });
});

import { describe, expect, it } from "vitest";
import { applyUserThreshold } from "./utils";

describe("applyUserThreshold", () => {
  const values = {
    "2024": { big: 60, small: 1 },
    "2025": { big: 38, small: 1 },
  };

  it("removes users below the threshold instead of bucketing them", () => {
    expect(applyUserThreshold(values, 5)).toEqual({
      "2024": { big: 60 },
      "2025": { big: 38 },
    });
  });

  it("keeps the data untouched when no user is below the threshold", () => {
    expect(applyUserThreshold(values, 1)).toEqual(values);
  });

  it("keeps the data untouched when the threshold is off", () => {
    expect(applyUserThreshold(values, 0)).toEqual(values);
  });
});

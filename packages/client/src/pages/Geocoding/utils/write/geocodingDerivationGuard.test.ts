import { describe, expect, it } from "vitest";
import { canDerive } from "./geocodingDerivation";

/**
 * A coordinate is two props pointing at Value entities fetched in a second
 * request. Read before those land, 1105 stored coordinates looked unreadable and
 * the panel said so on every load.
 */
describe("canDerive", () => {
  it("waits while the Values behind a coordinate are still coming", () => {
    expect(canDerive(["v-lon", "v-lat"], undefined)).toBe(false);
  });

  it("reads once they arrive", () => {
    expect(canDerive(["v-lon"], [{ id: "v-lon" }])).toBe(true);
  });

  it("treats an empty answer as an answer", () => {
    // asked for, none came back: that coordinate really is unreadable, and
    // saying so is the point of the state
    expect(canDerive(["v-lon"], [])).toBe(true);
  });

  it("does not wait for Values nothing asked for", () => {
    // a corpus where no Location carries a coordinate prop has nothing to fetch
    expect(canDerive([], undefined)).toBe(true);
  });
});

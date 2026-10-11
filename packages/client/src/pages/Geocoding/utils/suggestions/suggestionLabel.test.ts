import { describe, expect, it } from "vitest";
import { splitLabel } from "./suggestionLabel";

/**
 * Four suggestions for one query read as four identical names until the
 * administrative path is separated from them. On `Breslau` the brackets are the
 * entire difference between Nebraska, Texas, Ontario and Pennsylvania.
 */

describe("splitLabel", () => {
  it("separates the place from where it is", () => {
    expect(splitLabel("Breslau (Pierce, Nebraska, ... World)")).toEqual({
      name: "Breslau",
      region: "Pierce, Nebraska, ... World",
    });
  });

  it("tells two records with the same name apart", () => {
    const a = splitLabel("Breslau (Lavaca, Texas, ... World)");
    const b = splitLabel("Breslau (Ontario, Canada, ... World)");
    expect(a.name).toBe(b.name);
    expect(a.region).not.toBe(b.region);
  });

  it("gives no region where the source wrote none", () => {
    // a real record from the recorded response, and not a case to paper over
    expect(splitLabel("Roman Catholic Diocese of Görlitz")).toEqual({
      name: "Roman Catholic Diocese of Görlitz",
      region: "",
    });
  });

  it("keeps brackets that are part of the name rather than a path", () => {
    expect(splitLabel("(Unnamed)").name).toBe("(Unnamed)");
    expect(splitLabel("(Unnamed)").region).toBe("");
  });

  it("leaves an unclosed bracket alone", () => {
    expect(splitLabel("Wrocław (Poland").region).toBe("");
  });

  it("trims what it returns, so a column of them lines up", () => {
    expect(splitLabel("  Wrocław (Poland, Europe)  ")).toEqual({
      name: "Wrocław",
      region: "Poland, Europe",
    });
  });

  it("has something to show for a label the engine left empty", () => {
    expect(splitLabel("")).toEqual({ name: "", region: "" });
  });
});

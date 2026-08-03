import { describe, expect, it } from "vitest";
import { buildZipEntryNames, zipFileNameForDate } from "./documentExportZip";

describe("buildZipEntryNames", () => {
  it("names one .txt entry per document", () => {
    expect(
      buildZipEntryNames([
        { id: "1", title: "First" },
        { id: "2", title: "Second" },
      ])
    ).toEqual(["First.txt", "Second.txt"]);
  });

  it("makes duplicate titles unique", () => {
    expect(
      buildZipEntryNames([
        { id: "1", title: "Same" },
        { id: "2", title: "Same" },
        { id: "3", title: "Same" },
      ])
    ).toEqual(["Same.txt", "Same (2).txt", "Same (3).txt"]);
  });

  it("replaces characters that are illegal in a file name", () => {
    expect(buildZipEntryNames([{ id: "1", title: 'a/b\\c:d*e?f"g<h>i|j' }])).toEqual([
      "a_b_c_d_e_f_g_h_i_j.txt",
    ]);
  });

  it("falls back to the document id for a blank title", () => {
    expect(
      buildZipEntryNames([
        { id: "doc-1", title: "" },
        { id: "doc-2", title: "   " },
      ])
    ).toEqual(["doc-1.txt", "doc-2.txt"]);
  });
});

describe("zipFileNameForDate", () => {
  it("pads month and day", () => {
    expect(zipFileNameForDate(new Date(2026, 7, 3))).toBe("documents-export-2026-08-03.zip");
  });
});

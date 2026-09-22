import { describe, expect, it } from "vitest";
import { GeocodingAccuracy } from "@inkvisitor/shared/types/geocoding";
import {
  COLLAPSED_BY_DEFAULT,
  flatten,
  groupAtIndex,
  groupsOf,
  headerIndexOf,
  headingOffsets,
  idsInRange,
  parkedHeadings,
  revealRowTarget,
  rowOffsetOf,
  scrollTargetFor,
} from "./geocodingGroups";
import { GeocodingLocation } from "./useGeocodingLocations";

/**
 * The list is arranged, never narrowed.
 *
 * The control this replaces was a filter, so writing a coordinate removed the
 * row from the view that was showing it — the researcher lost their place and
 * could not see what they had just done. These check the property that fixes
 * it: every arrangement holds the same rows.
 */

const at = (id: string, over: Partial<GeocodingLocation> = {}): GeocodingLocation =>
  ({
    isGeocoded: false,
    problem: null,
    accuracy: null,
    placeType: null,
    entity: { id, labels: [id], language: "eng", status: "approved" },
    ...over,
  }) as GeocodingLocation;

const done = (id: string, over: Partial<GeocodingLocation> = {}) =>
  at(id, { isGeocoded: true, accuracy: GeocodingAccuracy.Precise, ...over });

const rowsOf = (groups: ReturnType<typeof groupsOf>) =>
  groups.flatMap((group) => group.rows.map((row) => row.entity.id));

describe("groupsOf, the population never changes", () => {
  const corpus = [
    done("Roma", { placeType: "settlement" as GeocodingLocation["placeType"] }),
    done("Odra"),
    at("Steinau", { placeType: "settlement" as GeocodingLocation["placeType"] }),
    at("Aura"),
    at("Quie", { problem: "latitude cannot be read" }),
  ];

  it("holds every Location under every arrangement", () => {
    for (const groupBy of ["coords", "placeType", "language", "status", "none"] as const) {
      expect(rowsOf(groupsOf(corpus, groupBy, {})).sort()).toEqual(
        corpus.map((row) => row.entity.id).sort(),
      );
    }
  });

  it("counts what it holds, so a heading is never a promise the list breaks", () => {
    for (const groupBy of ["coords", "placeType", "language", "status", "none"] as const) {
      const groups = groupsOf(corpus, groupBy, {});
      const counted = groups.reduce((total, group) => total + group.rows.length, 0);
      expect(counted).toBe(corpus.length);
    }
  });

  it("puts a Location whose coordinate cannot be read among those with none", () => {
    // it is not geocoded, and it is not a third category: nobody works through
    // a queue of broken rows, and its row still says what is wrong with it
    const [, ungeocoded] = groupsOf(corpus, "coords", {});
    expect(ungeocoded.rows.map((row) => row.entity.id)).toContain("Quie");
  });
});

describe("groupsOf, by coordinates", () => {
  const corpus = [done("Roma"), done("Odra"), at("Steinau"), at("Aura")];

  it("draws the geocoded group first", () => {
    // the boundary between the two is where the work happens: what was just
    // finished sits above it, what is next sits below
    expect(groupsOf(corpus, "coords", {}).map((group) => group.key)).toEqual([
      "geocoded",
      "ungeocoded",
    ]);
  });

  it("keeps both headings when a group is empty", () => {
    // a list with nothing left to do and no "no coordinates" heading reads as a
    // list that failed to load
    const groups = groupsOf([done("Roma")], "coords", {});
    expect(groups).toHaveLength(2);
    expect(groups[1].rows).toEqual([]);
  });

  it("puts a Location written in this session at the end of the geocoded group", () => {
    const written = [done("Roma"), done("Odra"), done("Steinau"), at("Aura")];
    const [geocoded] = groupsOf(written, "coords", { Steinau: 1 });
    expect(geocoded.rows.map((row) => row.entity.id)).toEqual(["Roma", "Odra", "Steinau"]);
  });

  it("orders this session's writes among themselves by when they were made", () => {
    const written = [done("Roma"), done("Odra"), done("Steinau")];
    const [geocoded] = groupsOf(written, "coords", { Roma: 2, Steinau: 1 });
    expect(geocoded.rows.map((row) => row.entity.id)).toEqual(["Odra", "Steinau", "Roma"]);
  });

  it("leaves untouched Locations in the collection's order", () => {
    // the group must not reshuffle around the researcher as they work
    const written = [done("Roma"), done("Odra"), done("Steinau")];
    const [geocoded] = groupsOf(written, "coords", {});
    expect(geocoded.rows.map((row) => row.entity.id)).toEqual(["Roma", "Odra", "Steinau"]);
  });
});

describe("groupsOf, by a field a Location may not carry", () => {
  const corpus = [
    at("Roma", { placeType: "settlement" as GeocodingLocation["placeType"] }),
    at("Odra", { placeType: "river" as GeocodingLocation["placeType"] }),
    at("Aura"),
    at("Steinau"),
  ];

  it("gives the Locations carrying no value a named group", () => {
    const groups = groupsOf(corpus, "placeType", {});
    const missing = groups.find((group) => group.label === "no kind recorded");
    expect(missing?.rows.map((row) => row.entity.id)).toEqual(["Aura", "Steinau"]);
  });

  it("sorts that group last, because it is the one about absence", () => {
    expect(groupsOf(corpus, "placeType", {}).at(-1)?.label).toBe("no kind recorded");
  });

  it("sorts the rest by name, so the arrangement does not move as values change", () => {
    const labels = groupsOf(corpus, "placeType", {})
      .map((group) => group.label)
      .filter((label) => label !== "no kind recorded");
    expect(labels).toEqual([...labels].sort());
  });

  it("names the missing group after the field", () => {
    // an entity carrying neither, which is what a corpus looks like before
    // anyone has set them
    const blank = at("Aura", {
      entity: { id: "Aura", labels: ["Aura"] },
    } as unknown as Partial<GeocodingLocation>);
    expect(groupsOf([blank], "language", {})[0].label).toBe("no language recorded");
    expect(groupsOf([blank], "status", {})[0].label).toBe("no status recorded");
  });
});

describe("groupsOf, ungrouped", () => {
  it("is one group holding everything, not an absence of grouping", () => {
    const corpus = [done("Roma"), at("Aura")];
    const groups = groupsOf(corpus, "none", {});
    expect(groups).toHaveLength(1);
    expect(groups[0].rows).toHaveLength(2);
  });
});

describe("flatten", () => {
  it("puts each heading before the rows it names", () => {
    const items = flatten(groupsOf([done("Roma"), at("Aura")], "coords", {}));
    expect(items.map((item) => (item.kind === "header" ? item.group.key : item.location.entity.id)))
      .toEqual(["geocoded", "Roma", "ungeocoded", "Aura"]);
  });

  it("keeps a heading for a group with no rows", () => {
    const items = flatten(groupsOf([done("Roma")], "coords", {}));
    expect(items.filter((item) => item.kind === "header")).toHaveLength(2);
  });
});

describe("headerIndexOf", () => {
  it("finds the row the scroller must reach for each group", () => {
    const items = flatten(groupsOf([done("Roma"), at("Aura"), at("Pisa")], "coords", {}));
    expect(headerIndexOf(items, "geocoded")).toBe(0);
    // one heading, one geocoded row, then the second heading
    expect(headerIndexOf(items, "ungeocoded")).toBe(2);
  });

  /**
   * Between choosing a different arrangement and the list being rebuilt around
   * it, the index still names the previous arrangement's groups. Scrolling to a
   * missing group would land at row 0 and read as the list having jumped on its
   * own, so a caller has to be able to tell that it is not there.
   */
  it("reports -1 for a group the list does not hold", () => {
    const items = flatten(groupsOf([done("Roma")], "coords", {}));
    expect(headerIndexOf(items, "settlement")).toBe(-1);
  });

  it("points at a heading, never at a row", () => {
    const items = flatten(groupsOf([done("Roma"), at("Aura")], "coords", {}));
    for (const key of ["geocoded", "ungeocoded"]) {
      expect(items[headerIndexOf(items, key)].kind).toBe("header");
    }
  });

  it("still finds a collapsed group, which is how it is reached to be opened", () => {
    const items = flatten(groupsOf([done("Roma"), at("Aura")], "coords", {}, { ungeocoded: true }));
    const index = headerIndexOf(items, "ungeocoded");
    expect(index).toBeGreaterThanOrEqual(0);
    expect(items[index].kind).toBe("header");
  });
});

describe("idsInRange", () => {
  const items = flatten(groupsOf([done("Roma"), done("Odra"), at("Aura"), at("Pisa")], "coords", {}));
  // [geocoded, Roma, Odra, ungeocoded, Aura, Pisa]

  it("collects the rows between two points, headings included in the span", () => {
    expect(idsInRange(items, 0, 5)).toEqual(["Roma", "Odra", "Aura", "Pisa"]);
  });

  it("reaches the same rows whichever end is clicked first", () => {
    expect(idsInRange(items, 1, 5)).toEqual(idsInRange(items, 5, 1));
  });

  it("names a single row when both ends are the same point", () => {
    expect(idsInRange(items, 1, 1)).toEqual(["Roma"]);
  });

  it("is empty for a span holding only headings", () => {
    expect(idsInRange(items, 0, 0)).toEqual([]);
  });
});

describe("headingOffsets", () => {
  it("measures each heading down the list, counting what precedes it", () => {
    // heading, one geocoded row, heading, two ungeocoded rows
    const items = flatten(groupsOf([done("Roma"), at("Aura"), at("Pisa")], "coords", {}));
    const offsets = headingOffsets(items, 24, 32);
    expect(offsets.get("geocoded")).toBe(0);
    expect(offsets.get("ungeocoded")).toBe(24 + 32);
  });

  it("counts a collapsed group's heading but not the rows it is hiding", () => {
    const rows = [done("Roma"), done("Pisa"), at("Aura")];
    const open = headingOffsets(flatten(groupsOf(rows, "coords", {})), 24, 32);
    const shut = headingOffsets(
      flatten(groupsOf(rows, "coords", {}, { geocoded: true })),
      24,
      32,
    );
    expect(open.get("ungeocoded")).toBe(24 + 64);
    expect(shut.get("ungeocoded")).toBe(24);
  });
});

describe("parkedHeadings", () => {
  const groups = [{ key: "a" }, { key: "b" }, { key: "c" }];
  const offsets = new Map([
    ["a", 0],
    ["b", 500],
    ["c", 1000],
  ]);

  it("parks a heading above the viewport at the top and one below it at the bottom", () => {
    const { above, below } = parkedHeadings(groups, offsets, 24, { top: 400, height: 300 });
    expect(above.map((g) => g.key)).toEqual(["a"]);
    expect(below.map((g) => g.key)).toEqual(["c"]);
  });

  /**
   * The property the whole design rests on: a heading is drawn in the list or
   * parked against an edge, never both. Parking one that is still on screen
   * would put the same label twice on one screen.
   */
  it("parks nothing that is still on screen", () => {
    const { above, below } = parkedHeadings(groups, offsets, 24, { top: 400, height: 300 });
    expect([...above, ...below].map((g) => g.key)).not.toContain("b");
  });

  it("counts a heading showing even one pixel of itself as on screen", () => {
    // b's heading spans 500-524; a viewport ending at 501 still shows a sliver
    const { below } = parkedHeadings(groups, offsets, 24, { top: 0, height: 501 });
    expect(below.map((g) => g.key)).toEqual(["c"]);
    // and one ending exactly at its top does not
    expect(parkedHeadings(groups, offsets, 24, { top: 0, height: 500 }).below.map((g) => g.key))
      .toEqual(["b", "c"]);
  });

  it("parks a heading only once its last pixel has gone", () => {
    expect(parkedHeadings(groups, offsets, 24, { top: 24, height: 300 }).above.map((g) => g.key))
      .toEqual(["a"]);
    expect(parkedHeadings(groups, offsets, 24, { top: 23, height: 300 }).above).toEqual([]);
  });

  /**
   * Before the scroller has been measured its height is zero, which read
   * literally means every heading is below the viewport — the whole set would
   * park at the bottom for one frame on every load.
   */
  it("parks nothing while the viewport is unmeasured", () => {
    expect(parkedHeadings(groups, offsets, 24, { top: 0, height: 0 })).toEqual({
      above: [],
      below: [],
    });
  });

  it("ignores a group the list does not hold", () => {
    const { above, below } = parkedHeadings(
      [...groups, { key: "gone" }],
      offsets,
      24,
      { top: 2000, height: 300 },
    );
    expect([...above, ...below].map((g) => g.key)).toEqual(["a", "b", "c"]);
  });
});

describe("scrollTargetFor", () => {
  const groups = [{ key: "a" }, { key: "b" }, { key: "c" }];
  const offsets = new Map([
    ["a", 0],
    ["b", 120],
    ["c", 700],
  ]);

  /**
   * The bug this exists for. Scrolling to a group's own offset puts its heading
   * at the very top of the scroller, which is exactly where the headings above
   * it are parked — so the group arrives underneath them and reads as having
   * disappeared, on the very click that was meant to reveal it.
   */
  it("stops short by the height of the headings that stay parked above", () => {
    // one heading (a) is still above b once b is at the top
    expect(scrollTargetFor(groups, offsets, 24, "b")).toBe(120 - 24);
    // two are above c
    expect(scrollTargetFor(groups, offsets, 24, "c")).toBe(700 - 48);
  });

  it("leaves the first group at the very top, having nothing parked above it", () => {
    expect(scrollTargetFor(groups, offsets, 24, "a")).toBe(0);
  });

  it("never asks for a negative scroll", () => {
    const tight = new Map([
      ["a", 0],
      ["b", 10],
    ]);
    expect(scrollTargetFor(groups, tight, 24, "b")).toBe(0);
  });

  it("reports nothing for a group the list does not hold", () => {
    expect(scrollTargetFor(groups, offsets, 24, "gone")).toBeNull();
  });

  /**
   * The destination has to leave the group visible, which is the property the
   * arithmetic is for: its heading lands exactly below the parked bars.
   */
  it("puts the heading immediately below the bars parked above it", () => {
    for (const key of ["a", "b", "c"]) {
      const top = scrollTargetFor(groups, offsets, 24, key) as number;
      const parked = parkedHeadings(groups, offsets, 24, { top, height: 400 });
      const drawnAt = (offsets.get(key) as number) - top;
      expect(drawnAt).toBe(parked.above.length * 24);
      expect(parked.above.map((g) => g.key)).not.toContain(key);
    }
  });
});

describe("a collapsed group", () => {
  const corpus = [done("Roma"), done("Odra"), done("Steinau"), at("Aura")];

  it("shows this session's writes and nothing else", () => {
    // collapsing to zero would hide the coordinate just written, which is the
    // one row the researcher needs to see
    const [geocoded] = groupsOf(corpus, "coords", { Steinau: 1 }, { geocoded: true });
    expect(geocoded.rows.map((row) => row.entity.id)).toEqual(["Steinau"]);
  });

  it("still reports how many it holds", () => {
    const [geocoded] = groupsOf(corpus, "coords", { Steinau: 1 }, { geocoded: true });
    expect(geocoded.total).toBe(3);
    expect(geocoded.collapsed).toBe(true);
  });

  it("is empty on a fresh page, so the list opens on the work", () => {
    // 1105 geocoded against 1386 to do: expanded, the queue is a thousand rows
    // below the fold
    const [geocoded, ungeocoded] = groupsOf(corpus, "coords", {}, { geocoded: true });
    expect(geocoded.rows).toEqual([]);
    expect(ungeocoded.rows.map((row) => row.entity.id)).toEqual(["Aura"]);
  });

  it("holds everything again once opened", () => {
    const [geocoded] = groupsOf(corpus, "coords", { Steinau: 1 }, { geocoded: false });
    expect(geocoded.rows).toHaveLength(3);
    expect(geocoded.collapsed).toBe(false);
  });

  it("collapses the geocoded group and nothing else by default", () => {
    expect(COLLAPSED_BY_DEFAULT).toEqual({ geocoded: true });
    const groups = groupsOf(corpus, "coords", {}, COLLAPSED_BY_DEFAULT);
    expect(groups.map((one) => one.collapsed)).toEqual([true, false]);
  });

  it("keeps the total honest under every arrangement", () => {
    // the heading counts what the group holds, not what it happens to draw
    for (const groupBy of ["coords", "placeType", "language", "status", "none"] as const) {
      const groups = groupsOf(corpus, groupBy, {}, { geocoded: true, all: true });
      const held = groups.reduce((total, one) => total + one.total, 0);
      expect(held).toBe(corpus.length);
    }
  });
});

describe("groupAtIndex", () => {
  const items = flatten(groupsOf([done("Roma"), done("Odra"), at("Aura")], "coords", {}));
  // [geocoded, Roma, Odra, ungeocoded, Aura]

  it("names the group a row belongs to", () => {
    expect(groupAtIndex(items, 1)?.key).toBe("geocoded");
    expect(groupAtIndex(items, 2)?.key).toBe("geocoded");
    expect(groupAtIndex(items, 4)?.key).toBe("ungeocoded");
  });

  it("names the group a heading opens", () => {
    expect(groupAtIndex(items, 0)?.key).toBe("geocoded");
    expect(groupAtIndex(items, 3)?.key).toBe("ungeocoded");
  });

  it("looks backwards, since the heading is usually off screen", () => {
    // the whole point: a virtualised list has not rendered the heading for the
    // rows at the top of the viewport
    const long = flatten(groupsOf(Array.from({ length: 40 }, (_, i) => done(`p${i}`)), "coords", {}));
    expect(groupAtIndex(long, 39)?.key).toBe("geocoded");
  });

  it("holds at the last group when the index runs past the end", () => {
    expect(groupAtIndex(items, 99)?.key).toBe("ungeocoded");
  });

  it("has nothing to name when there is nothing in the list", () => {
    expect(groupAtIndex([], 0)).toBe(null);
  });
});

describe("groupAtIndex, past a group that draws nothing", () => {
  it("names the group whose rows are on screen, not the collapsed one above", () => {
    // how a part-finished corpus opens: the geocoded group is collapsed and
    // draws no rows, so every row on screen belongs to the group below it
    const items = flatten(groupsOf([done("Roma"), at("Aura")], "coords", {}, { geocoded: true }));
    // [geocoded (0 rows), ungeocoded, Aura]
    expect(groupAtIndex(items, 0)?.key).toBe("ungeocoded");
  });

  it("still names a collapsed group once its own rows are drawn", () => {
    const items = flatten(groupsOf([done("Roma"), at("Aura")], "coords", { Roma: 1 }, { geocoded: true }));
    // [geocoded, Roma, ungeocoded, Aura]
    expect(groupAtIndex(items, 0)?.key).toBe("geocoded");
  });

  it("names the heading at the top when the list draws no rows at all", () => {
    // [geocoded (0 rows), ungeocoded (0 rows)] — nothing below to name, so the
    // bar names what the reader is actually looking at
    const items = flatten(groupsOf([done("Roma")], "coords", {}, { geocoded: true }));
    expect(groupAtIndex(items, 0)?.key).toBe("geocoded");
  });
});

describe("rowOffsetOf", () => {
  const items = flatten(groupsOf([done("Roma"), done("Odra"), at("Aura"), at("Pisa")], "coords", {}));
  // [geocoded, Roma, Odra, ungeocoded, Aura, Pisa] at heading 24, row 30

  it("counts the headings above a row as well as the rows", () => {
    expect(rowOffsetOf(items, "Roma", 24, 30)).toBe(24);
    expect(rowOffsetOf(items, "Odra", 24, 30)).toBe(54);
    // the second heading sits between, so Aura is two headings and two rows down
    expect(rowOffsetOf(items, "Aura", 24, 30)).toBe(108);
  });

  /**
   * A Location the list is not currently showing has no offset to travel to.
   * Collapsing a group is the ordinary way this happens, and the caller has to
   * be able to tell it apart from an offset of zero — the very first row.
   */
  it("reports nothing for a Location the list holds no row for", () => {
    const collapsed = flatten(
      groupsOf([done("Roma"), at("Aura")], "coords", {}, { geocoded: true }),
    );
    expect(rowOffsetOf(collapsed, "Roma", 24, 30)).toBeNull();
    expect(rowOffsetOf(items, "Verona", 24, 30)).toBeNull();
  });
});

describe("revealRowTarget", () => {
  const view = { top: 1000, height: 300 };

  it("says nothing has to move for a row already in the viewport", () => {
    expect(revealRowTarget(1100, 30, view, 0, 0)).toBeNull();
  });

  it("centres a row that is above or below the viewport", () => {
    // 300 tall, a 30 row: the row lands 135 from the top either way it came from
    expect(revealRowTarget(5000, 30, view, 0, 0)).toBe(5000 - 135);
    expect(revealRowTarget(20, 30, view, 0, 0)).toBe(0);
  });

  /**
   * The parked headings are drawn over the list rather than in it, so a row
   * underneath one is on screen and cannot be read. Counting that as visible is
   * what would leave a map click appearing to scroll nowhere.
   */
  it("counts a row hidden under a parked heading as out of sight", () => {
    // 1010 sits inside the viewport, but under a 24-tall bar parked at its top
    expect(revealRowTarget(1010, 30, view, 0, 0)).toBeNull();
    expect(revealRowTarget(1010, 30, view, 24, 0)).toBe(1010 - 135);
    // and the same against the bottom edge
    expect(revealRowTarget(1265, 30, view, 0, 0)).toBeNull();
    expect(revealRowTarget(1265, 30, view, 0, 24)).toBe(1265 - 135);
  });

  it("never asks the scroller to go above its own top", () => {
    expect(revealRowTarget(0, 30, { top: 900, height: 300 }, 0, 0)).toBe(0);
  });

  /**
   * Before the scroller has been measured nothing can be said about what is
   * visible in it, and centring against a height of zero would send every
   * selection to the very top of the list.
   */
  it("moves nothing while the viewport is unmeasured", () => {
    expect(revealRowTarget(5000, 30, { top: 0, height: 0 }, 0, 0)).toBeNull();
  });
});

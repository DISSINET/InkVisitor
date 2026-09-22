import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FilterChip, GeocodingFilterChips } from "./GeocodingFilterChips";
import { click, press, pressGlobally, render, Rendered, type } from "./renderForTest";
import { ANY, GeocodingFilters } from "./useGeocodingBrowse";

/**
 * The filters are on screen rather than behind a toggle, which only helps if an
 * unset one is legible as unset and a set one can be dropped without opening it.
 */

const CHIPS: FilterChip[] = [
  {
    key: "accuracy",
    label: "accuracy",
    options: [
      { value: ANY, label: "any" },
      { value: "precise", label: "precise" },
      { value: "approximate", label: "approximate" },
    ],
    counts: { [ANY]: 2491, precise: 689, approximate: 361 },
  },
  {
    key: "language",
    label: "language",
    options: [
      { value: ANY, label: "any" },
      { value: "deu", label: "German" },
    ],
  },
];

const filters = (over: Partial<GeocodingFilters> = {}): GeocodingFilters => ({
  label: "",
  createdBy: ANY,
  territoryId: ANY,
  subTerritories: "included",
  accuracy: ANY,
  placeType: ANY,
  language: ANY,
  status: ANY,
  ...over,
});

/** Long enough to earn a search field. */
const LONG_CHIP: FilterChip = {
  key: "language",
  label: "language",
  options: [
    { value: ANY, label: "any" },
    ...Array.from({ length: 12 }, (_, i) => ({ value: `l${i + 1}`, label: `lang ${i + 1}` })),
  ],
};

let view: Rendered | null = null;

const mount = (over: Partial<GeocodingFilters> = {}, setFilter = vi.fn(), onClearAll = vi.fn()) => {
  view = render(
    <GeocodingFilterChips
      chips={CHIPS}
      filters={filters(over)}
      setFilter={setFilter}
      onClearAll={onClearAll}
    />,
  );
  return { setFilter, onClearAll };
};

const mountLong = (setFilter = vi.fn()) => {
  view = render(
    <GeocodingFilterChips
      chips={[LONG_CHIP]}
      filters={filters()}
      setFilter={setFilter}
      onClearAll={vi.fn()}
    />,
  );
  return { setFilter };
};

// the menu is portalled to the body, so it outlives the container unless the
// tree is unmounted
afterEach(() => {
  view?.unmount();
  view = null;
});

const menu = () => document.body.querySelector('[role="listbox"]');
const options = () =>
  Array.from(document.body.querySelectorAll('[role="option"]')).map(
    (node) => node.textContent?.trim() || "",
  );

describe("a chip that is not set", () => {
  it("names its field and no value", () => {
    mount();
    expect(view!.texts("button")).toEqual(["accuracy", "language"]);
  });

  it("offers nothing to drop, since there is nothing to drop", () => {
    mount();
    expect(view!.all('[aria-label^="drop the"]')).toHaveLength(0);
  });

  it("does not offer to clear everything", () => {
    mount();
    expect(view!.texts("button")).not.toContain("clear all");
  });
});

describe("a chip that is set", () => {
  it("states its value, so the bar says what is in force rather than how many are", () => {
    mount({ accuracy: "precise" });
    expect(view!.one("button")?.textContent).toContain("precise");
  });

  it("carries its own control to drop it", () => {
    const { setFilter } = mount({ accuracy: "precise" });
    click(view!.one('[aria-label="drop the accuracy filter"]'));
    expect(setFilter).toHaveBeenCalledWith("accuracy", ANY);
  });

  it("drops from the keyboard as well as the mouse", () => {
    // a nested button would be invalid HTML and get reparented, so the control
    // is a span with a role - which makes the key handler the only route
    const { setFilter } = mount({ accuracy: "precise" });
    press(view!.one('[aria-label="drop the accuracy filter"]'), "Enter");
    expect(setFilter).toHaveBeenCalledWith("accuracy", ANY);
  });

  it("does not open the menu when its drop control is pressed", () => {
    mount({ accuracy: "precise" });
    click(view!.one('[aria-label="drop the accuracy filter"]'));
    expect(menu()).toBe(null);
  });

  it("offers to clear everything once anything is set", () => {
    const { onClearAll } = mount({ language: "deu" });
    const clear = view!.all("button").find((node) => node.textContent?.trim() === "clear all");
    click(clear || null);
    expect(onClearAll).toHaveBeenCalled();
  });
});

describe("the menu", () => {
  it("opens on the chip and closes on a second press", () => {
    mount();
    click(view!.one("button"));
    expect(menu()).not.toBe(null);
    click(view!.one("button"));
    expect(menu()).toBe(null);
  });

  it("carries the count each option would leave", () => {
    mount();
    click(view!.one("button"));
    expect(options()).toEqual(["any2491", "precise689", "approximate361"]);
  });

  it("lists the options of a chip that cannot be counted, the same way", () => {
    // one menu for every filter: a figure beside an option is the only thing
    // that varies, and a chip without figures is still a list to choose from
    mount();
    click(view!.all("button")[1]);
    expect(options()).toEqual(["any", "German"]);
  });

  it("leaves a short list without a field to search it", () => {
    mount();
    click(view!.all("button")[1]);
    expect(document.body.querySelectorAll("input").length).toBe(0);
  });

  it("carries a search field once the list is long, and narrows to what is typed", () => {
    mountLong();
    click(view!.one("button"));
    const field = document.body.querySelector("input");
    expect(field).not.toBe(null);
    type(field, "lang 1");
    // every label holding the text, and not the thirteen the chip offers
    expect(options()).toEqual(["lang 1", "lang 10", "lang 11", "lang 12"]);
  });

  it("says so when nothing matches, rather than showing an empty menu", () => {
    mountLong();
    click(view!.one("button"));
    type(document.body.querySelector("input"), "zzz");
    expect(options()).toEqual([]);
    expect(document.body.textContent).toContain("nothing matches");
  });

  it("marks the option in force", () => {
    mount({ accuracy: "precise" });
    click(view!.one("button"));
    const selected = Array.from(document.body.querySelectorAll('[aria-selected="true"]'));
    expect(selected.map((node) => node.textContent?.trim())).toEqual(["precise689"]);
  });

  it("sets the filter and closes when an option is chosen", () => {
    const { setFilter } = mount();
    click(view!.one("button"));
    const precise = Array.from(document.body.querySelectorAll('[role="option"]')).find((node) =>
      node.textContent?.startsWith("precise"),
    );
    click(precise || null);
    expect(setFilter).toHaveBeenCalledWith("accuracy", "precise");
    expect(menu()).toBe(null);
  });

  it("closes on Escape", () => {
    mount();
    click(view!.one("button"));
    pressGlobally("Escape");
    expect(menu()).toBe(null);
  });

  it("belongs to one chip at a time", () => {
    mount();
    click(view!.one("button"));
    expect(menu()?.getAttribute("aria-label")).toBe("accuracy");
    click(view!.all("button")[1]);
    expect(document.body.querySelectorAll('[role="listbox"]')).toHaveLength(1);
    expect(menu()?.getAttribute("aria-label")).toBe("language");
  });
});

describe("a value that is an empty string", () => {
  // the language dictionary offers an option labelled "empty" whose value is
  // "". Reading that as unset left the chip saying nothing while the list was
  // cut from 2491 rows to 49
  const withEmpty: FilterChip[] = [
    {
      key: "language",
      label: "language",
      options: [
        { value: ANY, label: "any" },
        { value: "", label: "empty" },
        { value: "deu", label: "German" },
      ],
    },
  ];

  const mountEmpty = (value: string) => {
    view = render(
      <GeocodingFilterChips
        chips={withEmpty}
        filters={filters({ language: value })}
        setFilter={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
  };

  it("reads as set, and says which option it is", () => {
    mountEmpty("");
    expect(view!.one("button")?.textContent).toContain("empty");
  });

  it("can be dropped, like any other value in force", () => {
    mountEmpty("");
    expect(view!.all('[aria-label="drop the language filter"]')).toHaveLength(1);
  });

  it("still reads as unset when nothing is chosen", () => {
    mountEmpty(ANY);
    expect(view!.all('[aria-label^="drop the"]')).toHaveLength(0);
  });
});

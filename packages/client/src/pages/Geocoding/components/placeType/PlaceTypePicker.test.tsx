import { IGeocodingPlaceType, defaultPlaceTypes } from "@inkvisitor/shared/types/geocoding";
import { expandPlaceTypes, nodeIdOf } from "../../utils/context/placeTypeHierarchy";
import React, { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlaceTypesProvider } from "../../hooks/placeTypesContext";
import { LocationTypeEntry } from "../../hooks/usePlaceTypeAssignments";
import { click, press, render, Rendered } from "../../utils/test/renderForTest";
import { PlaceTypePicker } from "./PlaceTypePicker";

/**
 * The picker is where a Location's location types are set. It has to say what
 * the place already has, offer only what can be added, and never offer to take
 * away what the Location only comes under through a subclass: that is not the
 * page's to remove.
 */

const types: IGeocodingPlaceType[] = [
  { ...defaultPlaceTypes()[0], id: "settlement", name: "settlement", conceptId: "c-settlement" },
  { ...defaultPlaceTypes()[1], id: "fortress", name: "fortress", conceptId: "c-fortress" },
  { ...defaultPlaceTypes()[2], id: "church", name: "church", conceptId: "c-church" },
  { ...defaultPlaceTypes()[3], id: "region", name: "region", conceptId: "" },
];

const entry = (typeId: string, over: Partial<LocationTypeEntry> = {}): LocationTypeEntry => ({
  typeId,
  inferred: false,
  via: `c-${typeId}`,
  shadowed: false,
  underNode: false,
  ...over,
});

const anchor = { left: 10, top: 10, bottom: 30 };
let view: Rendered | null = null;

const mount = (props: Partial<React.ComponentProps<typeof PlaceTypePicker>> = {}) => {
  view = render(
    <PlaceTypesProvider
      placeTypes={expandPlaceTypes(types, {}, {})}
      viaLabels={{ "c-city": "city" }}
    >
      <PlaceTypePicker anchor={anchor} onClose={() => undefined} {...props} />
    </PlaceTypesProvider>,
  );
};

afterEach(() => {
  view?.unmount();
  view = null;
  document.body.innerHTML = "";
});

const option = (name: string) =>
  [...document.querySelectorAll<HTMLButtonElement>("[role=option]")].find((one) =>
    one.textContent?.startsWith(name),
  )!;
const settle = () => act(async () => new Promise((resolve) => setTimeout(resolve, 5)));

describe("PlaceTypePicker, where location types are ticked", () => {
  it("ticks the location types the Location is classified under and no others", () => {
    mount({ held: [entry("fortress")], onToggle: vi.fn() });
    expect(option("fortress").getAttribute("aria-selected")).toBe("true");
    expect(option("settlement").getAttribute("aria-selected")).toBe("false");
  });

  it("offers a location type that is only inferred as already applying, and does not let it be unticked", () => {
    const onToggle = vi.fn();
    mount({
      held: [entry("settlement", { inferred: true, via: "c-city" })],
      onToggle,
    });
    const inferred = option("settlement");
    expect(inferred.disabled).toBe(true);
    expect(inferred.textContent).toContain("Already applies through city.");
    inferred.click();
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("treats a location type that another lies below the same way", () => {
    mount({
      held: [entry("settlement", { inferred: true, via: "c-city", shadowed: true })],
      onToggle: vi.fn(),
    });
    expect(option("settlement").disabled).toBe(true);
  });

  it("shows a location type with no Concept as unavailable, with the reason", () => {
    mount({ onToggle: vi.fn() });
    expect(option("region").disabled).toBe(true);
    expect(option("region").textContent).toContain("No Concept is assigned");
  });

  it("ticks one on a click, at once, and asks for it to be added", async () => {
    const onToggle = vi.fn().mockResolvedValue(true);
    mount({ held: [], onToggle });
    act(() => option("church").click());
    expect(onToggle).toHaveBeenCalledWith("church", true);
    expect(option("church").getAttribute("aria-selected")).toBe("true");
    await settle();
  });

  it("asks for a ticked one to be removed on a click, and shows it unticked", async () => {
    const onToggle = vi.fn().mockResolvedValue(true);
    mount({ held: [entry("church")], onToggle });
    act(() => option("church").click());
    expect(onToggle).toHaveBeenCalledWith("church", false);
    expect(option("church").getAttribute("aria-selected")).toBe("false");
    await settle();
  });

  it("puts the tick back where the write was refused", async () => {
    const onToggle = vi.fn().mockResolvedValue(false);
    mount({ held: [], onToggle });
    act(() => option("church").click());
    await settle();
    expect(option("church").getAttribute("aria-selected")).toBe("false");
  });

  it("waits for a write to finish before another can be made on the same place", async () => {
    let finish: (written: boolean) => void = () => undefined;
    const onToggle = vi.fn(() => new Promise<boolean>((resolve) => (finish = resolve)));
    mount({ held: [], onToggle });
    act(() => option("church").click());
    expect(option("fortress").disabled).toBe(true);
    await act(async () => finish(true));
    expect(option("fortress").disabled).toBe(false);
  });

  it("has no row for choosing none, since unticking is how one goes", () => {
    mount({ onToggle: vi.fn(), clearLabel: "leave it" });
    expect(document.body.textContent).not.toContain("leave it");
  });

  it("closes from its own button", () => {
    const onClose = vi.fn();
    mount({ onToggle: vi.fn(), onClose });
    const done = [...document.querySelectorAll("button")].find((one) => one.textContent === "done")!;
    act(() => done.click());
    expect(onClose).toHaveBeenCalled();
  });
});

describe("PlaceTypePicker, where one click chooses", () => {
  it("adds the one chosen", () => {
    const onChoose = vi.fn();
    mount({ onChoose });
    option("fortress").click();
    expect(onChoose).toHaveBeenCalledWith("fortress");
  });

  it("does not offer what the Location already has, or already comes under", () => {
    const onChoose = vi.fn();
    mount({
      held: [entry("fortress"), entry("settlement", { inferred: true, via: "c-city" })],
      onChoose,
    });
    expect(option("fortress").disabled).toBe(true);
    expect(option("fortress").textContent).toContain("This place already has it.");
    expect(option("settlement").disabled).toBe(true);
    option("fortress").click();
    option("settlement").click();
    expect(onChoose).not.toHaveBeenCalled();
  });

  it("offers choosing none, in the words it is given and with what it does under them", () => {
    const onChoose = vi.fn();
    mount({
      onChoose,
      clearLabel: "leave the location type as it is",
      clearDescription: "Only the coordinate is written.",
    });
    expect(option("leave the location type as it is").textContent).toContain(
      "Only the coordinate is written.",
    );
    option("leave the location type as it is").click();
    expect(onChoose).toHaveBeenCalledWith(null);
  });

  it("does not say that no location type is recorded under a choice that leaves them alone", () => {
    mount({ onChoose: vi.fn(), clearLabel: "leave the location type as it is" });
    expect(option("leave the location type as it is").textContent).not.toContain("is recorded");
  });
});

describe("PlaceTypePicker, for the keyboard and assistive technology", () => {
  const press = (key: string) =>
    act(async () => {
      document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    });

  it("takes focus to its first option when it opens, and gives it back to what opened it", () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    mount({ onToggle: vi.fn() });
    expect(document.activeElement).toBe(option("settlement"));
    view?.unmount();
    view = null;
    expect(document.activeElement).toBe(opener);
  });

  it("moves between the options that can be chosen with the arrow keys, skipping the ones that cannot", async () => {
    mount({ held: [entry("church", { inferred: true, via: "c-city" })], onToggle: vi.fn() });
    expect(document.activeElement).toBe(option("settlement"));
    await press("ArrowDown");
    expect(document.activeElement).toBe(option("fortress"));
    // church is only inferred and region has no Concept: neither can be chosen
    await press("ArrowDown");
    expect(document.activeElement).toBe(option("settlement"));
    await press("ArrowUp");
    expect(document.activeElement).toBe(option("fortress"));
  });

  it("says that several can be selected where it ticks, and not where one click chooses", () => {
    mount({ onToggle: vi.fn() });
    expect(document.querySelector("[role=listbox]")?.getAttribute("aria-multiselectable")).toBe("true");
    view?.unmount();
    mount({ onChoose: vi.fn() });
    expect(document.querySelector("[role=listbox]")?.hasAttribute("aria-multiselectable")).toBe(false);
  });

  it("keeps the done button out of the list of options", () => {
    mount({ onToggle: vi.fn() });
    const done = [...document.querySelectorAll("button")].find((one) => one.textContent === "done")!;
    expect(done).toBeTruthy();
    expect(document.querySelector("[role=listbox]")?.contains(done)).toBe(false);
  });
});

describe("PlaceTypePicker, saying what the choice is about", () => {
  it("shows the note under the title, which is where the coordinate it goes with is named", () => {
    mount({ note: "new location · 48.31000, 14.92000", onChoose: vi.fn() });
    expect(document.body.textContent).toContain("new location · 48.31000, 14.92000");
  });

  it("shows nothing extra when there is no note", () => {
    mount({ onChoose: vi.fn() });
    expect(document.body.textContent).not.toContain("new location");
  });

  it("heads the list with what is asked, the relation it is recorded as, and the note, outside the options", () => {
    mount({ note: "new location · 48.31000, 14.92000", onChoose: vi.fn() });
    const header = document.querySelector("[role=dialog]")!.firstElementChild as HTMLElement;
    expect(header.getAttribute("role")).toBeNull();
    expect(header.textContent).toBe(
      "add a location typerecorded asCLAClassificationnew location · 48.31000, 14.92000",
    );
    const heading = header.querySelector<HTMLElement>("[data-hint]")!;
    expect(heading.textContent).toBe("CLAClassification");
    expect(heading.dataset.hint).toContain("Classification (CLA) relation from the Location");
    expect(document.querySelector("[role=listbox]")!.textContent).not.toContain("Classification");
  });

  it("calls the header of a list that is ticked what the place has", () => {
    mount({ held: [], onToggle: vi.fn() });
    const header = document.querySelector("[role=dialog]")!.firstElementChild as HTMLElement;
    expect(header.textContent).toContain("location types of this place");
  });
});


describe("PlaceTypePicker, with the subclass tree of a location type", () => {
  // church <- cathedral <- metropolitan cathedral, church <- chapel
  const tree = {
    nodes: [
      { id: "c-church", parents: [] },
      { id: "c-cathedral", parents: ["c-church"] },
      { id: "c-chapel", parents: ["c-church"] },
      { id: "c-metropolitan", parents: ["c-cathedral"] },
    ],
    aliases: {},
  };
  const labels = {
    "c-church": { label: "church", detail: "" },
    "c-cathedral": { label: "cathedral", detail: "the church of a bishop's see" },
    "c-chapel": { label: "chapel", detail: "" },
    "c-metropolitan": { label: "metropolitan cathedral", detail: "" },
  };
  const nodes = (inactive: string[] = []) =>
    expandPlaceTypes(
      types.map((one) => (one.id === "church" ? { ...one, inactive } : one)),
      { "c-church": tree },
      labels
    );
  const mountTree = (
    inactive: string[] = [],
    props: Partial<React.ComponentProps<typeof PlaceTypePicker>> = {}
  ) => {
    view = render(
      <PlaceTypesProvider placeTypes={nodes(inactive)}>
        <PlaceTypePicker anchor={anchor} onClose={() => undefined} {...props} />
      </PlaceTypesProvider>
    );
  };
  const listOf = (label: string) =>
    document.querySelector(`[role=listbox][aria-label="subclasses of ${label}"]`);
  // the name, without the description under it
  const namesIn = (list: Element | null) =>
    [...(list?.querySelectorAll("[role=option]") ?? [])]
      .filter((one) => one.closest("[role=listbox]") === list)
      .map((one) => one.querySelector("span > span")?.textContent);
  // the pointer leaves the list the row is in for the row, as it does when it
  // moves from a row into the list opened beside it: only that row is entered.
  // React reads enter and leave from the mouseout of where the pointer came from
  const hover = async (name: string) => {
    const row = option(name).parentElement!;
    act(() => {
      row
        .closest("[role=listbox]")!
        .dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: row }));
    });
    await act(async () => new Promise((resolve) => setTimeout(resolve, 200)));
  };

  it("lists the location types the project set up, and opens the subclasses of one beside it on hover", async () => {
    mountTree([], { onChoose: vi.fn() });
    expect(option("cathedral")).toBeUndefined();
    await hover("church");
    const list = listOf("church");
    expect(namesIn(list)).toEqual(["cathedral", "chapel"]);
  });

  it("shows a location type as its name alone, without its Concept's detail under it", async () => {
    mountTree([], { onChoose: vi.fn() });
    await hover("church");
    expect(option("cathedral").textContent).toBe("cathedral");
    expect(document.body.textContent).not.toContain("the church of a bishop's see");
  });

  it("opens the subclasses of a subclass the pointer arrives on straight from another row", async () => {
    mountTree([], { onChoose: vi.fn() });
    await hover("church");
    // from the settlement row of the first list straight onto cathedral, which
    // enters the church row too, since its list sits inside it
    act(() => {
      option("settlement").dispatchEvent(
        new MouseEvent("mouseout", { bubbles: true, relatedTarget: option("cathedral").parentElement }),
      );
    });
    await act(async () => new Promise((resolve) => setTimeout(resolve, 200)));
    expect(namesIn(listOf("church"))).toEqual(["cathedral", "chapel"]);
    expect(namesIn(listOf("cathedral"))).toEqual(["metropolitan cathedral"]);
  });

  it("goes on down the tree, a subclass with subclasses of its own opening the next list", async () => {
    mountTree([], { onChoose: vi.fn() });
    await hover("church");
    await hover("cathedral");
    expect(namesIn(listOf("cathedral"))).toEqual(["metropolitan cathedral"]);
  });

  it("chooses a subclass with subclasses of its own by its own id, not by its root's", async () => {
    const onChoose = vi.fn();
    mountTree([], { onChoose });
    await hover("church");
    click(option("cathedral"));
    expect(onChoose).toHaveBeenCalledWith(nodeIdOf("church", "c-cathedral"));
  });

  it("does not offer a deactivated Concept, but still opens the way to what is offered below it", async () => {
    const onChoose = vi.fn();
    mountTree(["c-cathedral"], { onChoose });
    await hover("church");
    expect(option("cathedral").getAttribute("aria-disabled")).toBe("true");
    expect(option("cathedral").textContent).toContain("Deactivated");
    click(option("cathedral"));
    expect(onChoose).not.toHaveBeenCalled();
    await hover("cathedral");
    click(option("metropolitan cathedral"));
    expect(onChoose).toHaveBeenCalledWith(nodeIdOf("church", "c-metropolitan"));
  });

  it("leaves out a deactivated Concept that has nothing offered below it", async () => {
    mountTree(["c-chapel"], { onChoose: vi.fn() });
    await hover("church");
    expect(namesIn(listOf("church"))).toEqual(["cathedral"]);
  });

  it("opens the subclasses with the right arrow key and goes back with the left one", async () => {
    mountTree([], { onChoose: vi.fn() });
    act(() => option("church").focus());
    press(option("church"), "ArrowRight");
    await settle();
    expect(document.activeElement).toBe(option("cathedral"));
    press(option("cathedral"), "ArrowLeft");
    await settle();
    expect(listOf("church")).toBeNull();
    expect(document.activeElement).toBe(option("church"));
  });

  it("closes only the innermost list with Escape, and the whole picker from the first list", async () => {
    const onClose = vi.fn();
    mountTree([], { onChoose: vi.fn(), onClose });
    act(() => option("church").focus());
    press(option("church"), "ArrowRight");
    await settle();
    press(option("cathedral"), "Escape");
    await settle();
    expect(listOf("church")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(option("church"));
    press(option("church"), "Escape");
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps the arrow keys inside the picker, away from the row or card that opened it", () => {
    const outside = vi.fn();
    view = render(
      <div onKeyDown={outside}>
        <PlaceTypesProvider placeTypes={nodes()}>
          <PlaceTypePicker anchor={anchor} onClose={() => undefined} onChoose={vi.fn()} />
        </PlaceTypesProvider>
      </div>
    );
    press(option("church"), "ArrowDown");
    press(option("church"), "ArrowRight");
    expect(outside).not.toHaveBeenCalled();
  });
});

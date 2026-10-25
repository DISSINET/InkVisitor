import { IGeocodingPlaceType, defaultPlaceTypes } from "@inkvisitor/shared/types/geocoding";
import React, { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlaceTypesProvider } from "../../hooks/placeTypesContext";
import { LocationTypeEntry } from "../../hooks/usePlaceTypeAssignments";
import { render, Rendered } from "../../utils/test/renderForTest";
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
  ...over,
});

const anchor = { left: 10, top: 10, bottom: 30 };
let view: Rendered | null = null;

const mount = (props: Partial<React.ComponentProps<typeof PlaceTypePicker>> = {}) => {
  view = render(
    <PlaceTypesProvider placeTypes={types} viaLabels={{ "c-city": "city" }}>
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

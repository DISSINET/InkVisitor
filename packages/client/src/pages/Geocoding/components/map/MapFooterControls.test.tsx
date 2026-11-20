import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { click } from "../../utils/test/renderForTest";
import { GeocodingLocation } from "../../hooks/useGeocodingLocations";
import { render, Rendered } from "../../utils/test/renderForTest";
import { MapFooterControls } from "./MapFooterControls";

/**
 * The strip under the map says what a click does, and offers the same act
 * without a mouse wherever there is something to do it for.
 */

const selected = { entity: { id: "L1", labels: ["Garsten"] } } as unknown as GeocodingLocation;

let view: Rendered | null = null;
const onDeselect = vi.fn();
const mount = (props: { selected?: GeocodingLocation; canPlaceNew: boolean }) => {
  view = render(
    <MapFooterControls
      selected={props.selected}
      canPlaceNew={props.canPlaceNew}
      onDeselect={onDeselect}
      manual={{ lat: "", lon: "" }}
      onManualChange={vi.fn()}
      onSubmit={vi.fn()}
    />,
  );
  return view;
};

afterEach(() => {
  view?.unmount();
  view = null;
  onDeselect.mockReset();
});

describe("the strip under the map", () => {
  it("names the selected Location and offers the coordinate fields", () => {
    const { container } = mount({ selected, canPlaceNew: false });
    expect(container.textContent).toContain("click the map to set a coordinate for Garsten");
    expect(container.querySelectorAll("input")).toHaveLength(2);
  });

  it("offers to start a new Location, with the fields, when nothing is selected and one may be made", () => {
    const { container } = mount({ canPlaceNew: true });
    expect(container.textContent).toContain("click the map to start a new location");
    expect(container.querySelectorAll("input")).toHaveLength(2);
  });

  it("only says to select one, with no fields, where a new Location may not be made", () => {
    const { container } = mount({ canPlaceNew: false });
    expect(container.textContent).toContain("select a location to begin");
    expect(container.querySelectorAll("input")).toHaveLength(0);
  });

  it("offers to deselect only while something is selected, and asks for exactly that", () => {
    const { container } = mount({ selected, canPlaceNew: true });
    const buttons = Array.from(container.querySelectorAll("button")).filter((one) =>
      one.textContent?.includes("deselect"),
    );
    expect(buttons).toHaveLength(1);
    click(buttons[0]);
    expect(onDeselect).toHaveBeenCalledTimes(1);

    view?.unmount();
    const none = mount({ canPlaceNew: true });
    expect(none.container.textContent).not.toContain("deselect");
  });
});

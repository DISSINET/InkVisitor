import { IEntity } from "@inkvisitor/shared/types";
import React, { act, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "../utils/test/renderForTest";
import { CreatingLocation, useCreateLocation } from "./useCreateLocation";
import { GeocodingLocation } from "./useGeocodingLocations";
import { useRefreshedSelection } from "./useRefreshedSelection";

/**
 * Both hooks watch the same collection and both may change the selection, so
 * the case that matters is the one where a refetch arrives while a Location is
 * already selected.
 */

/** A row as the list holds it: a new object on every refetch, the same entity. */
const row = (id: string): GeocodingLocation =>
  ({ entity: { id, labels: [id] }, isGeocoded: false }) as unknown as GeocodingLocation;

const entity = (id: string) => ({ id, labels: [id] }) as unknown as IEntity;

let selected: GeocodingLocation | undefined;
let creating: CreatingLocation;
let choose: (location: GeocodingLocation | undefined) => void;

/** The selection a page keeps, and the options it hands to `useCreateLocation`. */
const useProbeSelection = (all: GeocodingLocation[]) => {
  const [current, setCurrent] = useState<GeocodingLocation | undefined>(undefined);
  selected = current;
  choose = setCurrent;
  const createOptions = {
    all,
    selectedId: current?.entity.id,
    clearFilters: vi.fn(),
    refresh: vi.fn(),
    onSelect: setCurrent,
  };
  return { current, setCurrent, createOptions };
};

type Probe = React.FC<{ all: GeocodingLocation[] }>;

const CreateFirst: Probe = ({ all }) => {
  const { current, setCurrent, createOptions } = useProbeSelection(all);
  creating = useCreateLocation(createOptions);
  useRefreshedSelection(all, current, setCurrent);
  return null;
};

const RefreshFirst: Probe = ({ all }) => {
  const { current, setCurrent, createOptions } = useProbeSelection(all);
  useRefreshedSelection(all, current, setCurrent);
  creating = useCreateLocation(createOptions);
  return null;
};

/** The two hooks, in either of the orders a page could call them in. */
describe.each([
  ["create hook first", CreateFirst],
  ["refresh hook first", RefreshFirst],
])("selection after the collection refetches, %s", (_order, Probe) => {
  it("takes the refreshed row of the Location that is selected", () => {
    const view = render(<Probe all={[row("a"), row("b")]} />);
    act(() => choose(row("a")));

    const refetched = [row("a"), row("b")];
    view.update(<Probe all={refetched} />);

    expect(selected).toBe(refetched[0]);
    view.unmount();
  });

  it("selects a Location just created even though another was selected and is refreshed in the same commit", () => {
    const view = render(<Probe all={[row("a")]} />);
    act(() => choose(row("a")));
    act(() => creating.created(entity("new")));

    // the refetch brings the new row and a new object for the one selected
    const refetched = [row("a"), row("new")];
    view.update(<Probe all={refetched} />);

    expect(selected).toBe(refetched[1]);
    view.unmount();
  });
});

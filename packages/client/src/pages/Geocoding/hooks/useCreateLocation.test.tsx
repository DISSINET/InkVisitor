import { IEntity } from "@inkvisitor/shared/types";
import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "../utils/test/renderForTest";
import { UserEnums } from "@inkvisitor/shared/enums";
import {
  CreatingLocation,
  LISTED_WITHIN_MS,
  mayCreateLocation,
  useCreateLocation,
} from "./useCreateLocation";
import { GeocodingLocation } from "./useGeocodingLocations";

const listed = (id: string): GeocodingLocation =>
  ({ entity: { id, labels: [id] }, isGeocoded: false }) as unknown as GeocodingLocation;

const entity = (id: string) => ({ id, labels: [id] }) as unknown as IEntity;

const toasts = vi.hoisted(() => ({ info: vi.fn() }));
vi.mock("react-toastify", () => ({ toast: toasts }));

const clearFilters = vi.fn();
const refresh = vi.fn();
const onSelect = vi.fn();
const onWriteDraft = vi.fn();
const draft = {
  geometry: { type: "Point" as const, coordinates: [14.92, 48.31] as [number, number] },
  accuracy: "approximate" as never,
  placeType: "settlement",
};

let creating: CreatingLocation;
const Probe = ({ all, selectedId }: { all: GeocodingLocation[]; selectedId?: string }) => {
  creating = useCreateLocation({ all, selectedId, clearFilters, refresh, onSelect, onWriteDraft });
  return null;
};

describe("useCreateLocation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearFilters.mockReset();
    refresh.mockReset();
    onSelect.mockReset();
    onWriteDraft.mockReset();
    toasts.info.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("opens and closes the dialog", () => {
    const view = render(<Probe all={[]} />);
    expect(creating.creating).toBe(false);
    act(() => creating.open());
    expect(creating.creating).toBe(true);
    act(() => creating.close());
    expect(creating.creating).toBe(false);
    view.unmount();
  });

  it("widens the list and asks for it again, but selects nothing until the Location is in it", () => {
    const view = render(<Probe all={[listed("old")]} />);
    act(() => creating.created(entity("new")));

    expect(clearFilters).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
    view.unmount();
  });

  it("selects the Location from the list it arrives in, once", () => {
    const view = render(<Probe all={[listed("old")]} />);
    act(() => creating.created(entity("new")));

    const arrived = listed("new");
    view.update(<Probe all={[listed("old"), arrived]} />);
    expect(onSelect).toHaveBeenCalledTimes(1);
    // the row of the list, not the entity the dialog returned
    expect(onSelect).toHaveBeenCalledWith(arrived);

    view.update(<Probe all={[listed("old"), arrived, listed("later")]} />);
    expect(onSelect).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it("gives up waiting, so a Location that turns up much later is not selected under the reader", () => {
    const view = render(<Probe all={[]} />);
    act(() => creating.created(entity("new")));

    act(() => {
      vi.advanceTimersByTime(LISTED_WITHIN_MS + 1);
    });
    view.update(<Probe all={[listed("new")]} />);

    expect(onSelect).not.toHaveBeenCalled();
    view.unmount();
  });

  it("says so when the Location has not shown up in time", () => {
    const view = render(<Probe all={[]} />);
    act(() => creating.created(entity("new")));
    expect(toasts.info).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(LISTED_WITHIN_MS + 1);
    });
    expect(toasts.info).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it("stops waiting when the reader selects another Location, so the new one does not take it back", () => {
    const view = render(<Probe all={[listed("old")]} selectedId="old" />);
    act(() => creating.created(entity("new")));

    // the reader clicks another row before the new one has arrived
    view.update(<Probe all={[listed("old")]} selectedId="other" />);
    view.update(<Probe all={[listed("old"), listed("new")]} selectedId="other" />);

    expect(onSelect).not.toHaveBeenCalled();
    view.unmount();
  });

  it("keeps waiting while the selection is the one it started from", () => {
    const view = render(<Probe all={[listed("old")]} selectedId="old" />);
    act(() => creating.created(entity("new")));
    view.update(<Probe all={[listed("old")]} selectedId="old" />);

    const arrived = listed("new");
    view.update(<Probe all={[listed("old"), arrived]} selectedId="old" />);
    expect(onSelect).toHaveBeenCalledWith(arrived);
    view.unmount();
  });

  it("writes the coordinate picked on the map once the Location exists, with the entity the dialog made", () => {
    const view = render(<Probe all={[]} />);
    act(() => creating.openWithDraft(draft));
    expect(creating.creating).toBe(true);

    const made = entity("new");
    act(() => creating.created(made));
    expect(onWriteDraft).toHaveBeenCalledTimes(1);
    expect(onWriteDraft).toHaveBeenCalledWith(made, draft);
    view.unmount();
  });

  it("writes a draft at most once, so a second Location never receives it", () => {
    const view = render(<Probe all={[]} />);
    act(() => creating.openWithDraft(draft));
    act(() => creating.created(entity("first")));
    act(() => creating.open());
    act(() => creating.created(entity("second")));
    expect(onWriteDraft).toHaveBeenCalledTimes(1);
    expect(onWriteDraft.mock.calls[0][0].id).toBe("first");
    view.unmount();
  });

  it("writes nothing when the dialog was dismissed before the create finished", () => {
    const view = render(<Probe all={[]} />);
    act(() => creating.openWithDraft(draft));
    act(() => creating.close());
    // the dialog's request was still running: its callback arrives after the dismissal
    act(() => creating.created(entity("late")));
    expect(onWriteDraft).not.toHaveBeenCalled();
    view.unmount();
  });

  it("opens a plain dialog with no draft, even after a draft was abandoned", () => {
    const view = render(<Probe all={[]} />);
    act(() => creating.openWithDraft(draft));
    act(() => creating.open());
    act(() => creating.created(entity("plain")));
    expect(onWriteDraft).not.toHaveBeenCalled();
    view.unmount();
  });

  it("can be used as a click handler: the event it is given is never taken for a draft", () => {
    const view = render(<Probe all={[]} />);
    const asHandler = creating.open as unknown as (event: unknown) => void;
    act(() => asHandler({ type: "click" }));
    act(() => creating.created(entity("plain")));
    expect(onWriteDraft).not.toHaveBeenCalled();
    view.unmount();
  });
});

describe("who may make a Location", () => {
  it.each([
    [UserEnums.Role.Owner, true],
    [UserEnums.Role.Admin, true],
    [UserEnums.Role.Editor, true],
    [UserEnums.Role.Viewer, false],
    [undefined, false],
  ])("%s: %s", (role, allowed) => {
    expect(mayCreateLocation(role)).toBe(allowed);
  });
});

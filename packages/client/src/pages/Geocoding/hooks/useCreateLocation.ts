import { UserEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { GeocodingLocation } from "./useGeocodingLocations";

/**
 * How long a created Location is waited for before the page stops looking for
 * it. The list is a server search followed by a second request for the
 * coordinate Values, so the new row arrives some moments after the write.
 */
export const LISTED_WITHIN_MS = 20_000;

/** Who is offered a way to make a Location: anyone the server would let create one. */
export const mayCreateLocation = (role: UserEnums.Role | undefined): boolean =>
  role !== undefined && role !== UserEnums.Role.Viewer;

interface UseCreateLocation {
  /** Every Location the page holds, before any filter narrows the list. */
  all: GeocodingLocation[];
  /** The Location selected now, which the reader may change while one is awaited. */
  selectedId: string | undefined;
  /** Widens the list to every Location. */
  clearFilters: () => void;
  /** Asks for the Locations again. */
  refresh: () => void;
  onSelect: (location: GeocodingLocation) => void;
}

export interface CreatingLocation {
  /** Whether the create dialog is open. */
  creating: boolean;
  open: () => void;
  close: () => void;
  /** What the dialog calls once the Location exists. */
  created: (entity: IEntity) => void;
}

/** A created Location not yet in the list, and what was selected when it was made. */
interface Awaited {
  id: string;
  from: string | undefined;
}

/**
 * Making a Location from the Geocoding page, and picking it up afterwards.
 *
 * The new Location is selected from the page's own collection once it is in it,
 * and not from the entity the dialog hands back: every write on this page is
 * checked against the row it was selected as, and a row taken from anywhere else
 * has no coordinate state to be checked against.
 *
 * The filters are cleared rather than amended because a new Location is used in
 * no statement, so a territory filter can never list it, and it starts Pending
 * in the language the dialog chose, which the other filters may exclude.
 *
 * Waiting ends when the reader selects something else, so a row that arrives
 * later never takes the selection from a choice made in the meantime.
 */
export const useCreateLocation = ({
  all,
  selectedId,
  clearFilters,
  refresh,
  onSelect,
}: UseCreateLocation): CreatingLocation => {
  const [creating, setCreating] = useState(false);
  const [awaited, setAwaited] = useState<Awaited | null>(null);

  useEffect(() => {
    if (!awaited) {
      return;
    }
    const found = all.find((location) => location.entity.id === awaited.id);
    if (found) {
      onSelect(found);
      setAwaited(null);
    }
  }, [all, awaited]);

  useEffect(() => {
    if (!awaited) {
      return;
    }
    const timer = setTimeout(() => {
      setAwaited(null);
      toast.info("The new Location was created, but the list has not shown it yet.");
    }, LISTED_WITHIN_MS);
    return () => clearTimeout(timer);
  }, [awaited]);

  useEffect(() => {
    if (awaited && selectedId !== awaited.from && selectedId !== awaited.id) {
      setAwaited(null);
    }
  }, [selectedId]);

  const created = useCallback(
    (entity: IEntity) => {
      clearFilters();
      refresh();
      setAwaited({ id: entity.id, from: selectedId });
    },
    [clearFilters, refresh, selectedId],
  );

  return {
    creating,
    open: () => setCreating(true),
    close: () => setCreating(false),
    created,
  };
};

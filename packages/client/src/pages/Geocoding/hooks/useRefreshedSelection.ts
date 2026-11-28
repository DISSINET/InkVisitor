import { Dispatch, SetStateAction, useEffect } from "react";
import { GeocodingLocation } from "./useGeocodingLocations";

/**
 * Keeps the selected Location in step with the collection it came from.
 *
 * `selected` is a snapshot taken when the row was clicked. After a write the
 * collection refetches, and under the default ungeocoded filter the row leaves
 * the list - so without re-syncing, the panel and the map keep showing the
 * pre-write state and the coordinate never visibly lands.
 *
 * The replacement is applied only if the Location it refreshes is still the
 * selected one when the update runs. A refetch also lands in the same commit as
 * a selection made by another effect, such as a Location just created, and a
 * refresh of the previous selection must not put that one back.
 */
export const useRefreshedSelection = (
  all: GeocodingLocation[],
  selected: GeocodingLocation | undefined,
  setSelected: Dispatch<SetStateAction<GeocodingLocation | undefined>>,
) => {
  useEffect(() => {
    if (!selected) {
      return;
    }
    const fresh = all.find((location) => location.entity.id === selected.entity.id);
    if (fresh && fresh !== selected) {
      setSelected((current) => (current?.entity.id === selected.entity.id ? fresh : current));
    }
  }, [all, selected]);
};

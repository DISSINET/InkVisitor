import { GeoJsonGeometry, geometryAnchor } from "@inkvisitor/shared/types/geometry";
import { useCallback, useState } from "react";
import type { Suggestion } from "../types/engine";
import { addRecent, loadRecent, RecentGeocode, saveRecent } from "../utils/write/recentGeocodes";

/** What a write reports once it has landed. */
export interface WrittenGeometry {
  id: string;
  label: string;
  geometry: GeoJsonGeometry;
  accuracy: string;
  /** The suggestion the geometry came from, when it came from one. */
  suggestion?: Suggestion;
}

/**
 * The places this browser has just geocoded, kept across visits.
 *
 * `record` is given to the writer, which calls it once per geometry that was
 * saved — so the strip is fed by every route that writes, and none of them has
 * to remember to.
 */
export const useRecentGeocodes = () => {
  const [recent, setRecent] = useState<RecentGeocode[]>(loadRecent);

  const record = useCallback((written: WrittenGeometry) => {
    const anchor = geometryAnchor(written.geometry);
    setRecent((current) => {
      const next = addRecent(current, {
        id: written.id,
        label: written.label,
        lat: anchor.lat,
        lon: anchor.lon,
        kind: written.geometry.type,
        accuracy: written.accuracy,
        suggestion: written.suggestion,
        at: Date.now(),
      });
      saveRecent(next);
      return next;
    });
  }, []);

  return { recent, record };
};

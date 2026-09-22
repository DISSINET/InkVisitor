import { IEntity } from "@inkvisitor/shared/types";
import {
  GeocodingAccuracy,
  GeocodingPlaceType,
  IGeocodingRoles,
} from "@inkvisitor/shared/types/geocoding";

/**
 * Turning a Location's metaproperties into a coordinate.
 *
 * Pure functions, separated from the hook that feeds them, because this is where
 * invariant I1 lives and it is the one piece worth testing against real shapes
 * rather than against a running app.
 */

/** A Location's geocoding state, derived rather than stored. */
export interface DerivedGeocoding {
  /** True only when I1 is satisfied in full. */
  isGeocoded: boolean;
  /** Longitude, from `geo:x`. Null whenever the Location is not geocoded. */
  lon: number | null;
  /** Latitude, from `geo:y`. */
  lat: number | null;
  accuracy: GeocodingAccuracy | null;
  /** Present independently of `isGeocoded` — a type says nothing about a coordinate. */
  placeType: GeocodingPlaceType | null;
  /**
   * Why a Location with coordinate props still reads as ungeocoded, for a list
   * that would otherwise show an unexplained gap. Null when there is nothing to
   * explain — either it is geocoded, or it carries no geocoding props at all.
   */
  problem: string | null;
}

const ungeocoded = (problem: string | null): DerivedGeocoding => ({
  isGeocoded: false,
  lon: null,
  lat: null,
  accuracy: null,
  placeType: null,
  problem,
});

/** The prop whose type is `conceptId`, ignoring nested children. */
const propOfType = (entity: IEntity, conceptId: string) =>
  conceptId ? (entity.props || []).find((prop) => prop.type?.entityId === conceptId) : undefined;

/**
 * Every entity id a Location's geocoding props point at.
 *
 * A search result carries only these ids — `IResponseEntity` bundles no entity
 * map, unlike the detail and statement responses — so the labels behind them
 * take a second, batched fetch.
 */
export const collectGeoValueIds = (entities: IEntity[], roles: IGeocodingRoles): string[] => {
  const wanted = [roles.x, roles.y, roles.accuracy, roles.type].filter(Boolean);
  const ids = new Set<string>();
  for (const entity of entities) {
    for (const conceptId of wanted) {
      const valueId = propOfType(entity, conceptId)?.value?.entityId;
      if (valueId) {
        ids.add(valueId);
      }
    }
  }
  return [...ids];
};

/**
 * A coordinate that cannot be read is not a coordinate: a blank label, a
 * non-number, or a value outside the earth's range all mean ungeocoded rather
 * than a point rendered somewhere wrong.
 */
const readCoordinate = (label: string | undefined, limit: number): number | null => {
  const parsed = Number((label || "").trim());
  if (!label || !label.trim() || !Number.isFinite(parsed) || Math.abs(parsed) > limit) {
    return null;
  }
  return parsed;
};

/** Reverses a role map — stored as name → entity id, read here id → name. */
const nameForEntity = <T extends string>(
  map: Partial<Record<T, string>>,
  entityId: string | undefined,
): T | null => {
  if (!entityId) {
    return null;
  }
  const hit = Object.entries(map).find(([, id]) => id === entityId);
  return hit ? (hit[0] as T) : null;
};

/**
 * Reads one Location's geocoding state.
 *
 * `values` maps entity id to entity for everything `collectGeoValueIds`
 * returned. An id missing from it has been deleted since the prop was written,
 * which I1 treats the same as a blank label.
 */
export const deriveGeocoding = (
  entity: IEntity,
  roles: IGeocodingRoles,
  values: Record<string, IEntity>,
): DerivedGeocoding => {
  if (!roles.x || !roles.y || !roles.accuracy) {
    return ungeocoded(null);
  }

  const placeTypeId = propOfType(entity, roles.type)?.value?.entityId;
  const placeType = nameForEntity<GeocodingPlaceType>(roles.placeTypes, placeTypeId);

  const xProp = propOfType(entity, roles.x);
  const yProp = propOfType(entity, roles.y);
  const accuracyProp = propOfType(entity, roles.accuracy);

  if (!xProp && !yProp && !accuracyProp) {
    return { ...ungeocoded(null), placeType };
  }

  const missing = [!xProp && "longitude", !yProp && "latitude", !accuracyProp && "accuracy"].filter(
    Boolean,
  );
  if (missing.length) {
    return { ...ungeocoded(`missing ${missing.join(" and ")}`), placeType };
  }

  const lon = readCoordinate(values[xProp!.value.entityId]?.labels?.[0], 180);
  const lat = readCoordinate(values[yProp!.value.entityId]?.labels?.[0], 90);
  const accuracy = nameForEntity<GeocodingAccuracy>(
    roles.accuracyValues,
    accuracyProp!.value.entityId,
  );

  if (lon === null || lat === null) {
    const unreadable = [lon === null && "longitude", lat === null && "latitude"].filter(Boolean);
    return { ...ungeocoded(`${unreadable.join(" and ")} cannot be read`), placeType };
  }
  if (!accuracy) {
    return { ...ungeocoded("accuracy is not one of the configured values"), placeType };
  }

  return { isGeocoded: true, lon, lat, accuracy, placeType, problem: null };
};

/**
 * Whether a coordinate can be read yet.
 *
 * A coordinate is two props pointing at Value entities, fetched in a second
 * request. Read before those land, every stored coordinate looks unreadable and
 * every geocoded Location looks not geocoded — which is a claim about the corpus
 * rather than about the fetch, and the panel prints it in the colour it keeps
 * for a corpus that is broken.
 *
 * An empty answer is an answer: `[]` means the Values were asked for and none
 * came back, which really is unreadable. `undefined` means nobody has asked yet.
 */
export const canDerive = (valueIds: string[], values: unknown[] | undefined): boolean =>
  valueIds.length === 0 || values !== undefined;

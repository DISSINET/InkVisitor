import { IEntity } from "@inkvisitor/shared/types";
import { GeoJsonGeometry, geometryAnchor, parseGeometry } from "@inkvisitor/shared/types/geometry";
import { GeocodingAccuracy, IGeocodingRoles } from "@inkvisitor/shared/types/geocoding";

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
  /** The GeoJSON geometry. Null whenever the Location is not geocoded. */
  geometry: GeoJsonGeometry | null;
  /**
   * Longitude of the anchor — the point itself for a Point, the centre of the
   * bounding box for any other shape. Null whenever the Location is not geocoded.
   */
  lon: number | null;
  /** Latitude of the anchor. */
  lat: number | null;
  accuracy: GeocodingAccuracy | null;
  /**
   * The id of the project's kind of place, independent of `isGeocoded` — a kind
   * says nothing about a coordinate. Not a prop, so it is not derived here: a
   * Location has a kind by a Classification relation, which the collection of
   * Locations joins in.
   */
  placeType: string | null;
  /**
   * Why a Location with coordinate props still reads as ungeocoded, for a list
   * that would otherwise show an unexplained gap. Null when there is nothing to
   * explain — either it is geocoded, or it carries no geocoding props at all.
   */
  problem: string | null;
}

const ungeocoded = (problem: string | null): DerivedGeocoding => ({
  isGeocoded: false,
  geometry: null,
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
  const wanted = [roles.geometry, roles.accuracy].filter(Boolean);
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
  if (!roles.geometry || !roles.accuracy) {
    return ungeocoded(null);
  }

  const geometryProp = propOfType(entity, roles.geometry);
  const accuracyProp = propOfType(entity, roles.accuracy);

  if (!geometryProp && !accuracyProp) {
    return ungeocoded(null);
  }

  const missing = [!geometryProp && "geometry", !accuracyProp && "accuracy"].filter(Boolean);
  if (missing.length) {
    return ungeocoded(`missing ${missing.join(" and ")}`);
  }

  // a geometry that cannot be read is not a geometry: a blank label, text that
  // is not GeoJSON, or a position outside the earth's range all mean ungeocoded
  // rather than a shape rendered somewhere wrong
  const geometry = parseGeometry(values[geometryProp!.value.entityId]?.labels?.[0]);
  const accuracy = nameForEntity<GeocodingAccuracy>(
    roles.accuracyValues,
    accuracyProp!.value.entityId,
  );

  if (!geometry) {
    return ungeocoded("geometry cannot be read");
  }
  if (!accuracy) {
    return ungeocoded("accuracy is not one of the configured values");
  }

  const { lon, lat } = geometryAnchor(geometry);
  return { isGeocoded: true, geometry, lon, lat, accuracy, placeType: null, problem: null };
};

/**
 * Whether a coordinate can be read yet.
 *
 * A geometry is a prop pointing at a Value entity, fetched in a second
 * request. Read before those land, every stored geometry looks unreadable and
 * every geocoded Location looks not geocoded — which is a claim about the corpus
 * rather than about the fetch, and the panel prints it in the colour it keeps
 * for a corpus that is broken.
 *
 * An empty answer is an answer: `[]` means the Values were asked for and none
 * came back, which really is unreadable. `undefined` means nobody has asked yet.
 */
export const canDerive = (valueIds: string[], values: unknown[] | undefined): boolean =>
  valueIds.length === 0 || values !== undefined;

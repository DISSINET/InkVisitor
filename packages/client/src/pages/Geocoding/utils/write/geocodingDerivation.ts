import { IEntity, IProp } from "@inkvisitor/shared/types";
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
  /** The Concept the accuracy prop is valued with, in the project's list or not. */
  accuracy: GeocodingAccuracy | null;
  /**
   * That Concept's label, and "not in the accuracy list" beside it where the
   * project no longer lists it; empty while it cannot be read.
   */
  accuracyLabel: string;
  /**
   * The id of the project's location type, independent of `isGeocoded` — a location type
   * says nothing about a coordinate. Not a prop, so it is not derived here: a
   * Location has a location type by a Classification relation, which the collection of
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
  accuracyLabel: "",
  placeType: null,
  problem,
});

/** The top-level prop whose type is `conceptId`. */
const propOfType = (entity: IEntity, conceptId: string) =>
  conceptId ? (entity.props || []).find((prop) => prop.type?.entityId === conceptId) : undefined;

/**
 * The accuracy prop of a Location: the subproperty of its geometry prop, or,
 * where the Location was written before accuracy moved under the geometry, the
 * prop beside it.
 */
const accuracyPropOf = (entity: IEntity, roles: IGeocodingRoles, geometryProp?: IProp) =>
  (geometryProp?.children || []).find((child) => child.type?.entityId === roles.accuracy) ??
  propOfType(entity, roles.accuracy);

/**
 * Every entity id a Location's geocoding props point at that has to be read.
 *
 * A search result carries only these ids — `IResponseEntity` bundles no entity
 * map, unlike the detail and statement responses — so the labels behind them
 * take a second, batched fetch: the geometry's, which is the coordinate, and the
 * accuracy Concept's, which is what the accuracy is called.
 */
export const collectGeoValueIds = (entities: IEntity[], roles: IGeocodingRoles): string[] => {
  const ids = new Set<string>();
  for (const entity of entities) {
    const geometryProp = propOfType(entity, roles.geometry);
    for (const valueId of [
      geometryProp?.value?.entityId,
      roles.accuracy ? accuracyPropOf(entity, roles, geometryProp)?.value?.entityId : undefined,
    ]) {
      if (valueId) {
        ids.add(valueId);
      }
    }
  }
  return [...ids];
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
  const accuracyProp = accuracyPropOf(entity, roles, geometryProp);

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
  const accuracy = accuracyProp!.value?.entityId || null;

  if (!geometry) {
    return ungeocoded("geometry cannot be read");
  }
  if (!accuracy) {
    return ungeocoded("accuracy has no value");
  }

  // a Concept the project has since taken off its list still says how close the
  // coordinate is, and the coordinate is kept: hiding it would hide every place
  // coded with an accuracy the moment the owner tidied the list
  const label = values[accuracy]?.labels?.[0] ?? "";
  const accuracyLabel =
    label && !roles.accuracies.includes(accuracy) ? `${label} (not in the accuracy list)` : label;

  const { lon, lat } = geometryAnchor(geometry);
  return {
    isGeocoded: true,
    geometry,
    lon,
    lat,
    accuracy,
    accuracyLabel,
    placeType: null,
    problem: null,
  };
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

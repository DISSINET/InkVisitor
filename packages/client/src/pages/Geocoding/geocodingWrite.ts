import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp, IReference } from "@inkvisitor/shared/types";
import {
  GeocodingAccuracy,
  GeocodingPlaceType,
  IGeocodingRoles,
} from "@inkvisitor/shared/types/geocoding";
import { UserOptions } from "@inkvisitor/shared/types/response-user";
import { CEntity, CProp, CReference } from "constructors";

/**
 * Planning a coordinate write.
 *
 * Separated from the calls that execute it so the ordering, the replacement and
 * the provenance can be tested without a server. The plan says what will happen;
 * `geocodingWriteExecute` is the only thing that makes it happen.
 */

/** One source's claim, as it will be recorded on the Location. */
export interface GeocodingProvenance {
  /** The engine's own suggester slug, which keys the Resource assignment. */
  source: string;
  /** The record's id in that source. */
  sourceId: string;
}

export interface GeocodingWriteInput {
  /** The Location as last read. The executor re-reads before writing anything. */
  location: IEntity;
  roles: IGeocodingRoles;
  lon: number;
  lat: number;
  accuracy: GeocodingAccuracy;
  /**
   * The kind of place to record. A value sets it, `null` removes it, and
   * `undefined` leaves whatever the Location already states.
   */
  placeType?: GeocodingPlaceType | null;
  provenance?: GeocodingProvenance[];
  /**
   * The coordinate the Location already carries, where it has one.
   *
   * A write that keeps the coordinate and changes only the kind of place - the
   * common correction - would otherwise mint two fresh Value entities for the
   * same longitude and latitude and orphan the pair it replaced. The orphans
   * survive whenever something else refers to them or the account cannot delete,
   * so they accumulate on exactly the operation done most often.
   */
  current?: { lon: number | null; lat: number | null } | null;
  /** Supplies the language the created Value entities are given. */
  userOptions: UserOptions;
}

export interface GeocodingWritePlan {
  /** Value entities to create, in the order they are created. */
  newValues: IEntity[];
  /** The Location's complete new props array — the update replaces, never appends. */
  props: IProp[];
  references: IReference[];
  /**
   * Value entities the write orphans. Deleted only after the update succeeds,
   * and only through the route that refuses a still-referenced entity.
   */
  displacedValueIds: string[];
  /** What the Location carried before. The platform's audit records only the new state. */
  previous: { props: IProp[]; references: IReference[] };
  /**
   * True when a coordinate already on the Location is being replaced by a
   * different one. False for a first coordinate, and false for a write that
   * leaves the coordinate where it is and changes only what kind of place it is.
   */
  isOverwrite: boolean;
}

/** Why a write cannot proceed, phrased for the researcher rather than the log. */
export type GeocodingWriteBlock = { blocked: string };

export const isBlocked = (
  result: GeocodingWritePlan | GeocodingWriteBlock,
): result is GeocodingWriteBlock => "blocked" in result;

/**
 * Six decimal places is about 0.1 m at the equator — finer than any source here
 * can justify, and far finer than a mouse click. A raw float from a map event
 * carries fifteen, which reads as a precision claim nobody made.
 */
export const formatCoordinate = (value: number): string => String(Number(value.toFixed(6)));

const propFor = (typeId: string, valueId: string): IProp => {
  const prop = CProp();
  prop.type.entityId = typeId;
  prop.value.entityId = valueId;
  return prop;
};

// CEntity leaves `data` empty; every Value in this corpus carries a logicalType,
// so the created ones match rather than being a recognisably different shape
const valueEntity = (label: string, userOptions: UserOptions): IEntity => {
  const entity = CEntity(userOptions, EntityEnums.Class.Value, label);
  entity.data = { logicalType: EntityEnums.LogicalType.Definite };
  return entity;
};

/**
 * Builds everything a coordinate write needs, or refuses with a reason.
 *
 * Refuses rather than degrades: a place type the project has no Concept for
 * would otherwise be silently dropped, which is how a controlled vocabulary
 * stops being controlled. The caller offers to create the Concept.
 */
export const planGeocodingWrite = (
  input: GeocodingWriteInput,
): GeocodingWritePlan | GeocodingWriteBlock => {
  const {
    location,
    roles,
    lon,
    lat,
    accuracy,
    placeType,
    provenance = [],
    userOptions,
    current,
  } = input;

  if (!roles.x || !roles.y || !roles.accuracy) {
    return { blocked: "The geocoding Concepts are not assigned yet — set them in the settings." };
  }

  const accuracyId = roles.accuracyValues[accuracy];
  if (!accuracyId) {
    return { blocked: `No Concept is assigned for the accuracy "${accuracy}".` };
  }

  /**
   * `null` and `undefined` are different answers. `null` is "this Location
   * states no kind of place", which removes the prop; `undefined` is "not my
   * business", which leaves whatever is there — what a coordinate correction
   * means, since it says nothing about what the place is.
   */
  const clearsPlaceType = placeType === null;
  let placeTypeId: string | undefined;
  if (placeType) {
    placeTypeId = roles.placeTypes[placeType];
    if (!placeTypeId) {
      return { blocked: `No Concept is assigned for the kind of place "${placeType}".` };
    }
    if (!roles.type) {
      return { blocked: "No Concept is assigned for the kind-of-place role." };
    }
  }

  const previousProps = location.props || [];
  const previousReferences = location.references || [];

  // the same coordinate written again is the same coordinate: its Value entities
  // are kept where the Location already carries them
  const unchanged =
    !!current &&
    current.lon != null &&
    current.lat != null &&
    formatCoordinate(current.lon) === formatCoordinate(lon) &&
    formatCoordinate(current.lat) === formatCoordinate(lat);
  const keptLon = unchanged
    ? previousProps.find((prop) => prop.type?.entityId === roles.x && !!prop.value?.entityId)
    : undefined;
  const keptLat = unchanged
    ? previousProps.find((prop) => prop.type?.entityId === roles.y && !!prop.value?.entityId)
    : undefined;

  // every role this write owns; whatever the Location carried for them is
  // replaced rather than added to, so a second write never leaves two longitudes
  const ownedTypes = [
    keptLon ? "" : roles.x,
    keptLat ? "" : roles.y,
    roles.accuracy,
    placeTypeId || clearsPlaceType ? roles.type : "",
  ].filter(Boolean);
  const displaced = previousProps.filter((prop) => ownedTypes.includes(prop.type?.entityId));

  const lonValue = keptLon ? undefined : valueEntity(formatCoordinate(lon), userOptions);
  const latValue = keptLat ? undefined : valueEntity(formatCoordinate(lat), userOptions);
  const newValues: IEntity[] = [lonValue, latValue].filter((entity): entity is IEntity => !!entity);

  const props: IProp[] = [
    ...previousProps.filter((prop) => !ownedTypes.includes(prop.type?.entityId)),
    ...(lonValue ? [propFor(roles.x, lonValue.id)] : []),
    ...(latValue ? [propFor(roles.y, latValue.id)] : []),
    propFor(roles.accuracy, accuracyId),
  ];
  if (placeTypeId) {
    props.push(propFor(roles.type, placeTypeId));
  }

  // `llm-coords` is the model's own guess rather than a gazetteer: it has no
  // record to cite, so it never becomes a reference
  const references = [...previousReferences];
  for (const claim of provenance) {
    const resourceId = roles.resources[claim.source];
    if (!resourceId || !claim.sourceId) {
      continue;
    }
    const idValue = valueEntity(claim.sourceId, userOptions);
    newValues.push(idValue);
    references.push(CReference(resourceId, idValue.id));
  }

  return {
    newValues,
    props,
    references,
    // Only the coordinate Values, which this feature mints and nothing else
    // names. The accuracy and place type roles point at Concepts drawn from the
    // project's own vocabulary — a previous accuracy or a previous type is a
    // Concept other Locations use, and offering it for deletion asks the server
    // to remove a term from the vocabulary because one place stopped using it.
    displacedValueIds: displaced
      .filter((prop) => prop.type?.entityId === roles.x || prop.type?.entityId === roles.y)
      .map((prop) => prop.value?.entityId)
      .filter((id): id is string => !!id),
    previous: { props: previousProps, references: previousReferences },
    // the coordinate Values it replaces, so a first coordinate and a kept one
    // both read as false however much else the write changes
    isOverwrite: displaced.some(
      (prop) => prop.type?.entityId === roles.x || prop.type?.entityId === roles.y,
    ),
  };
};

/**
 * Whether the Location changed underneath a flow that has been open for the
 * length of an engine call plus however long a researcher took to decide.
 *
 * Compared on the props this feature owns rather than on the whole entity: an
 * unrelated edit elsewhere on the Location is not a reason to refuse, but a
 * coordinate written by someone else is.
 */
export const coordinateChanged = (
  before: IEntity,
  after: IEntity,
  roles: IGeocodingRoles,
): boolean => {
  const owned = [roles.x, roles.y, roles.accuracy, roles.type].filter(Boolean);
  const signature = (entity: IEntity) =>
    JSON.stringify(
      (entity.props || [])
        .filter((prop) => owned.includes(prop.type?.entityId))
        .map((prop) => [prop.type.entityId, prop.value?.entityId])
        .sort(),
    );
  return signature(before) !== signature(after);
};

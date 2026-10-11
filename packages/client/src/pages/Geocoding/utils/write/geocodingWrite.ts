import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp, IReference } from "@inkvisitor/shared/types";
import { GeocodingAccuracy, IGeocodingRoles } from "@inkvisitor/shared/types/geocoding";
import {
  GeoJsonGeometry,
  geometryEquals,
  isGeoJsonGeometry,
  serializeGeometry,
} from "@inkvisitor/shared/types/geometry";
import { UserOptions } from "@inkvisitor/shared/types/response-user";
import { CEntity, CProp, CReference } from "constructors";

/**
 * Planning a geometry write.
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
  /** The one GeoJSON geometry the Location will carry. */
  geometry: GeoJsonGeometry;
  accuracy: GeocodingAccuracy;
  /**
   * The id of the project's kind of place to record. A value sets it, `null`
   * removes it, and `undefined` leaves whatever the Location already states.
   * Recorded as a Classification relation once the props are written, not as a
   * prop, so it is carried on the plan for the executor rather than in `props`.
   */
  placeType?: string | null;
  provenance?: GeocodingProvenance[];
  /**
   * The geometry the Location already carries, where it has one.
   *
   * A write that keeps the geometry and changes only the kind of place - the
   * common correction - would otherwise mint a fresh Value entity for the same
   * shape and orphan the one it replaced. The orphans survive whenever something
   * else refers to them or the account cannot delete, so they accumulate on
   * exactly the operation done most often.
   */
  current?: GeoJsonGeometry | null;
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
  /**
   * The Concept the Location is to be classified under, `null` where its kinds
   * are to be removed, and `undefined` where they are left alone.
   */
  kindConceptId: string | null | undefined;
  /** What the Location carried before. The platform's audit records only the new state. */
  previous: { props: IProp[]; references: IReference[] };
  /**
   * True when a geometry already on the Location is being replaced by a
   * different one. False for a first geometry, and false for a write that
   * leaves the geometry where it is and changes only what kind of place it is.
   */
  isOverwrite: boolean;
}

/** Why a write cannot proceed, phrased for the researcher rather than the log. */
export type GeocodingWriteBlock = { blocked: string };

export const isBlocked = (
  result: GeocodingWritePlan | GeocodingWriteBlock,
): result is GeocodingWriteBlock => "blocked" in result;

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
 * Builds everything a geometry write needs, or refuses with a reason.
 *
 * Refuses rather than degrades: a kind of place the project has no Concept for
 * would otherwise be silently dropped, which is how a controlled vocabulary
 * stops being controlled.
 */
export const planGeocodingWrite = (
  input: GeocodingWriteInput,
): GeocodingWritePlan | GeocodingWriteBlock => {
  const {
    location,
    roles,
    geometry,
    accuracy,
    placeType,
    provenance = [],
    userOptions,
    current,
  } = input;

  if (!roles.geometry || !roles.accuracy) {
    return { blocked: "The geocoding Concepts are not assigned yet — set them in the settings." };
  }

  // whatever is written must be readable back: a click on a repeated copy of
  // the world, or a source that answered NaN, would otherwise store a geometry
  // the page then reports as unreadable
  if (!isGeoJsonGeometry(geometry)) {
    return { blocked: "That is not a valid GeoJSON geometry — a position is outside the earth." };
  }

  const accuracyId = roles.accuracyValues[accuracy];
  if (!accuracyId) {
    return { blocked: `No Concept is assigned for the accuracy "${accuracy}".` };
  }

  /**
   * `null` and `undefined` are different answers. `null` is "this Location
   * states no kind of place", which removes its Classifications; `undefined` is
   * "not my business", which leaves whatever is there — what a coordinate
   * correction means, since it says nothing about what the place is.
   */
  let kindConceptId: string | null | undefined = placeType === null ? null : undefined;
  if (placeType) {
    const kind = roles.placeTypes.find((one) => one.id === placeType);
    if (!kind) {
      return { blocked: `The kind of place "${placeType}" is not defined in the settings.` };
    }
    if (!kind.conceptId) {
      return { blocked: `No Concept is assigned for the kind of place "${kind.name}".` };
    }
    kindConceptId = kind.conceptId;
  }

  const previousProps = location.props || [];
  const previousReferences = location.references || [];

  // the same geometry written again is the same geometry: its Value entity is
  // kept where the Location already carries it
  const unchanged = geometryEquals(current, geometry);
  const keptGeometry = unchanged
    ? previousProps.find((prop) => prop.type?.entityId === roles.geometry && !!prop.value?.entityId)
    : undefined;

  // every role this write owns; whatever the Location carried for them is
  // replaced rather than added to, so a second write never leaves two geometries
  const ownedTypes = [keptGeometry ? "" : roles.geometry, roles.accuracy].filter(Boolean);
  const displaced = previousProps.filter((prop) => ownedTypes.includes(prop.type?.entityId));

  const geometryValue = keptGeometry
    ? undefined
    : valueEntity(serializeGeometry(geometry), userOptions);
  const newValues: IEntity[] = geometryValue ? [geometryValue] : [];

  const props: IProp[] = [
    ...previousProps.filter((prop) => !ownedTypes.includes(prop.type?.entityId)),
    ...(geometryValue ? [propFor(roles.geometry, geometryValue.id)] : []),
    propFor(roles.accuracy, accuracyId),
  ];

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
    kindConceptId,
    // Only the geometry Values, which this feature mints and nothing else
    // names. The accuracy role points at Concepts drawn from the project's own
    // vocabulary — a previous accuracy is a Concept other Locations use, and
    // offering it for deletion asks the server to remove a term from the
    // vocabulary because one place stopped using it.
    displacedValueIds: displaced
      .filter((prop) => prop.type?.entityId === roles.geometry)
      .map((prop) => prop.value?.entityId)
      .filter((id): id is string => !!id),
    previous: { props: previousProps, references: previousReferences },
    // the geometry Value it replaces, so a first geometry and a kept one
    // both read as false however much else the write changes
    isOverwrite: displaced.some((prop) => prop.type?.entityId === roles.geometry),
  };
};

/**
 * Whether a write has to stop and ask before it replaces a geometry.
 *
 * Decided on what the Location carries rather than on whether the page could
 * read it: a geometry Value that will not parse is still somebody's geometry,
 * and the write deletes it all the same.
 */
export const needsOverwriteConfirmation = (
  plan: Pick<GeocodingWritePlan, "isOverwrite">,
  confirmed: boolean,
): boolean => plan.isOverwrite && !confirmed;

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
  const owned = [roles.geometry, roles.accuracy].filter(Boolean);
  const signature = (entity: IEntity) =>
    JSON.stringify(
      (entity.props || [])
        .filter((prop) => owned.includes(prop.type?.entityId))
        .map((prop) => [prop.type.entityId, prop.value?.entityId])
        .sort(),
    );
  return signature(before) !== signature(after);
};

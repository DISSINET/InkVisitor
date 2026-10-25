import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp, IReference } from "@inkvisitor/shared/types";
import {
  GeocodingAccuracy,
  IGeocodingRoles,
  rolesShareAConcept,
} from "@inkvisitor/shared/types/geocoding";
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
   * The id of the project's location type to record. A value sets it, `null`
   * removes it, and `undefined` leaves whatever the Location already states.
   * Recorded as a Classification relation once the props are written, not as a
   * prop, so it is carried on the plan for the executor rather than in `props`.
   */
  placeType?: string | null;
  provenance?: GeocodingProvenance[];
  /**
   * The geometry the Location already carries, where it has one.
   *
   * A write that keeps the geometry and changes only the location type - the
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
  /**
   * The Location's complete new props array — the update replaces, never appends.
   * The accuracy is a child of the geometry prop, not a prop beside it.
   */
  props: IProp[];
  references: IReference[];
  /**
   * Value entities the write orphans. Deleted only after the update succeeds,
   * and only through the route that refuses a still-referenced entity.
   */
  displacedValueIds: string[];
  /**
   * The Concept the Location is to be classified under, `null` where its location types
   * are to be removed, and `undefined` where they are left alone.
   */
  kindConceptId: string | null | undefined;
  /** What the Location carried before. The platform's audit records only the new state. */
  previous: { props: IProp[]; references: IReference[] };
  /**
   * True when a geometry already on the Location is being replaced by a
   * different one. False for a first geometry, and false for a write that
   * leaves the geometry where it is and changes only what location type it is.
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

/**
 * The roles a child of the geometry prop can hold, which this write owns.
 *
 * Whatever else a researcher hung under the geometry (another subproperty of
 * their own) is carried over untouched.
 */
const childRoles = (roles: IGeocodingRoles): string[] =>
  [roles.accuracy, roles.epistemicSource].filter(Boolean);

/**
 * The Resources of the gazetteers behind a coordinate, one each.
 *
 * A source with no Resource assigned has nothing to point at — `llm-coords` is
 * the model's own guess and never has one — and two matches from one gazetteer
 * are still one source of the coordinate.
 */
const sourceResources = (provenance: GeocodingProvenance[], roles: IGeocodingRoles): string[] => [
  ...new Set(provenance.map((claim) => roles.resources[claim.source]).filter(Boolean)),
];

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
 * Refuses rather than degrades: a location type the project has no Concept for
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
  if (rolesShareAConcept(roles)) {
    return {
      blocked:
        "The geocoding settings give one Concept to two roles — assign a different Concept to each.",
    };
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
   * states no location type", which removes its Classifications; `undefined` is
   * "not my business", which leaves whatever is there — what a coordinate
   * correction means, since it says nothing about what the place is.
   */
  let kindConceptId: string | null | undefined = placeType === null ? null : undefined;
  if (placeType) {
    const kind = roles.placeTypes.find((one) => one.id === placeType);
    if (!kind) {
      return { blocked: `The location type "${placeType}" is not defined in the settings.` };
    }
    if (!kind.conceptId) {
      return { blocked: `No Concept is assigned for the location type "${kind.name}".` };
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

  // every role this write owns at the top level; whatever the Location carried
  // for them is replaced rather than added to, so a second write never leaves two
  // geometries. The accuracy belongs here too: an earlier version wrote it beside
  // the geometry, and that prop goes where the accuracy is written under it
  const ownedTypes = [keptGeometry ? "" : roles.geometry, roles.accuracy].filter(Boolean);
  const displaced = previousProps.filter((prop) => ownedTypes.includes(prop.type?.entityId));

  const geometryValue = keptGeometry
    ? undefined
    : valueEntity(serializeGeometry(geometry), userOptions);
  const newValues: IEntity[] = geometryValue ? [geometryValue] : [];

  const owned = childRoles(roles);

  // the sources are named only where the project has the role for them; the
  // references below record them either way
  const sources = roles.epistemicSource ? sourceResources(provenance, roles) : [];
  const sourceChildren = (known: string[]) =>
    sources
      .filter((resourceId) => !known.includes(resourceId))
      .map((resourceId) => propFor(roles.epistemicSource, resourceId));

  // an accuracy that is already there keeps its own prop — its certainty, its id,
  // whatever hangs under it — and takes the new value; the one written beside
  // the geometry by an earlier version is that same prop moved under it
  const accuracyOf = (base: IProp | undefined): IProp =>
    base ? { ...base, value: { ...base.value, entityId: accuracyId } } : propFor(roles.accuracy, accuracyId);

  // the geometry prop the Location keeps carries its other children over, and
  // the sources it already names, to which the new ones are added: a coordinate
  // that did not move is still the one those gazetteers supplied. A new geometry
  // prop starts with what this write says about it, and with whatever else a
  // researcher hung under the geometry it replaces, which is about the place and
  // not about the coordinate that moved
  let geometryProp: IProp;
  if (keptGeometry) {
    const children = keptGeometry.children || [];
    const named = children
      .filter((child) => child.type?.entityId === roles.epistemicSource)
      .map((child) => child.value?.entityId);
    // moved down a level, the prop beside the geometry would push anything two
    // levels under it to a fourth, which nothing shows, so such a prop is not reused
    const beside = previousProps.find((prop) => prop.type?.entityId === roles.accuracy);
    const existing =
      children.find((child) => child.type?.entityId === roles.accuracy) ??
      (beside?.children?.some((child) => child.children?.length) ? undefined : beside);
    const accuracyProp = accuracyOf(existing);
    // the accuracy stays where it was among the children, and a repeat goes
    const at = children.findIndex((child) => child.type?.entityId === roles.accuracy);
    const without = children.filter((child) => child.type?.entityId !== roles.accuracy);
    geometryProp = {
      ...keptGeometry,
      children: [
        ...(at === -1
          ? [...without, accuracyProp]
          : [...without.slice(0, at), accuracyProp, ...without.slice(at)]),
        ...sourceChildren(named),
      ],
    };
  } else {
    const replaced = displaced.find((prop) => prop.type?.entityId === roles.geometry);
    const carried = (replaced?.children || []).filter((child) => !owned.includes(child.type?.entityId));
    geometryProp = {
      ...propFor(roles.geometry, geometryValue!.id),
      children: [accuracyOf(undefined), ...carried, ...sourceChildren([])],
    };
  }

  const props: IProp[] = [
    ...previousProps
      .filter((prop) => !ownedTypes.includes(prop.type?.entityId))
      .map((prop) => (prop === keptGeometry ? geometryProp : prop)),
    ...(keptGeometry ? [] : [geometryProp]),
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
  const ownedChildren = childRoles(roles);
  const signature = (entity: IEntity) =>
    JSON.stringify(
      (entity.props || [])
        .filter((prop) => owned.includes(prop.type?.entityId))
        .map((prop) => [
          prop.type.entityId,
          prop.value?.entityId,
          (prop.children || [])
            .filter((child) => ownedChildren.includes(child.type?.entityId))
            .map((child) => [child.type.entityId, child.value?.entityId])
            .sort(),
        ])
        .sort(),
    );
  return signature(before) !== signature(after);
};

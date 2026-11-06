import { RelationEnums } from "@inkvisitor/shared/enums";
import { Relation } from "@inkvisitor/shared/types";
import { IGeocodingPlaceType } from "@inkvisitor/shared/types/geocoding";
import { v4 as uuidv4 } from "uuid";

/**
 * Recording a Location's location types.
 *
 * A location type is a Classification from the Location to the type's Concept,
 * and a Location can have several. Adding one leaves the others where they are,
 * and removing one removes only its own Classification. Only a Classification
 * under a Concept some location type uses is the page's to remove: a Location
 * can be classified under Concepts that mean nothing to this page, and removing
 * those would be erasing someone's data to tidy the page's own.
 */

/** What to do to a Location's location types, by the Concept each is assigned. */
export interface KindEdit {
  /** Concepts to classify the Location under, where it is not already. */
  add?: string[];
  /** Concepts whose Classification of the Location is removed. */
  remove?: string[];
  /** Remove the Classification under every Concept a location type uses. */
  removeAll?: boolean;
}

export interface KindChange {
  /** The Classifications to create, none for a Concept the Location is already classified under. */
  creates: Relation.IRelation[];
  /** The Classifications to remove, with any repeat of one that stays. */
  removeIds: string[];
}

/**
 * What an edit needs doing, given the Classifications the Location has now.
 *
 * `existing` is every Classification that has the Location as its subject, as
 * the server holds it. A Concept in both `add` and `remove` is added: the later
 * of two contradictory instructions is the one a caller meant to keep.
 */
export const planKindEdit = (
  locationId: string,
  placeTypes: IGeocodingPlaceType[],
  existing: Relation.IRelation[],
  edit: KindEdit,
): KindChange => {
  const kindConcepts = new Set(placeTypes.map((one) => one.conceptId).filter(Boolean));
  const ours = existing.filter(
    (relation) =>
      relation.type === RelationEnums.Type.Classification &&
      relation.entityIds[0] === locationId &&
      kindConcepts.has(relation.entityIds[1]),
  );
  const adding = [...new Set(edit.add ?? [])].filter((concept) => kindConcepts.has(concept));
  const keeping = new Set(adding);
  const removing = new Set(edit.remove ?? []);

  const held = new Set<string>();
  const removeIds: string[] = [];
  for (const relation of ours) {
    const concept = relation.entityIds[1];
    if ((edit.removeAll || removing.has(concept)) && !keeping.has(concept)) {
      removeIds.push(relation.id);
    } else if (held.has(concept)) {
      // a repeat of one that stays, so a Location is left with exactly one
      removeIds.push(relation.id);
    } else {
      held.add(concept);
    }
  }

  return {
    creates: adding
      .filter((concept) => !held.has(concept))
      .map((concept) => ({
        id: uuidv4(),
        type: RelationEnums.Type.Classification,
        entityIds: [locationId, concept],
      })),
    removeIds,
  };
};

/**
 * What choosing one location type, or none, needs doing.
 *
 * A Concept adds that location type and leaves the others alone; `null` removes
 * every one the page can, which only the control that says so does.
 */
export const planKindChange = (
  locationId: string,
  placeTypes: IGeocodingPlaceType[],
  existing: Relation.IRelation[],
  conceptId: string | null,
): KindChange =>
  planKindEdit(
    locationId,
    placeTypes,
    existing,
    conceptId ? { add: [conceptId] } : { removeAll: true },
  );

/** The calls a location type change needs, named so a test can supply them without a server. */
export interface KindGateway {
  readClassifications: (locationId: string) => Promise<Relation.IRelation[]>;
  createRelation: (relation: Relation.IRelation) => Promise<void>;
  deleteRelation: (relationId: string) => Promise<void>;
}

export type KindOutcome = { ok: true; changed: boolean } | { ok: false; reason: string };

/**
 * Applies an edit, the new Classifications first.
 *
 * Created before the old ones are removed so a failure part-way leaves the
 * Location with what it had and the new type rather than with less.
 */
export const executeKindEdit = async (
  locationId: string,
  placeTypes: IGeocodingPlaceType[],
  edit: KindEdit,
  gateway: KindGateway,
): Promise<KindOutcome> => {
  let existing: Relation.IRelation[];
  try {
    existing = await gateway.readClassifications(locationId);
  } catch {
    return { ok: false, reason: "Could not read the location's current location types." };
  }
  const change = planKindEdit(locationId, placeTypes, existing, edit);
  if (!change.creates.length && !change.removeIds.length) {
    return { ok: true, changed: false };
  }
  for (const relation of change.creates) {
    try {
      await gateway.createRelation(relation);
    } catch {
      return { ok: false, reason: "The location type could not be saved." };
    }
  }
  for (const id of change.removeIds) {
    try {
      await gateway.deleteRelation(id);
    } catch {
      return {
        ok: false,
        reason: change.creates.length
          ? "The new location type was saved, but the previous one could not be removed."
          : "The location type could not be removed.",
      };
    }
  }
  return { ok: true, changed: true };
};

/** Applies the choice of one location type, or of none. */
export const executeKindChange = (
  locationId: string,
  placeTypes: IGeocodingPlaceType[],
  conceptId: string | null,
  gateway: KindGateway,
): Promise<KindOutcome> =>
  executeKindEdit(
    locationId,
    placeTypes,
    conceptId ? { add: [conceptId] } : { removeAll: true },
    gateway,
  );

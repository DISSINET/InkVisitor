import { RelationEnums } from "@inkvisitor/shared/enums";
import { Relation } from "@inkvisitor/shared/types";
import { IGeocodingPlaceType } from "@inkvisitor/shared/types/geocoding";
import { v4 as uuidv4 } from "uuid";

/**
 * Recording a Location's kind of place.
 *
 * A kind is a Classification from the Location to the kind's Concept. Setting
 * one replaces the Location's other kinds and leaves every other Classification
 * alone — a Location can be classified under Concepts that mean nothing to this
 * page, and removing those would be erasing someone's data to tidy the page's
 * own.
 */

export interface KindChange {
  /** The Classification to create, absent where the Location already has it. */
  create: Relation.IRelation | null;
  /** The Classifications to remove: this Location's other kinds. */
  removeIds: string[];
}

/**
 * What a change to `conceptId` — or to no kind, where null — needs doing.
 *
 * `existing` is every Classification that has the Location as its subject, as
 * the server holds it now. Only those pointing at a Concept some kind uses are
 * the page's to remove.
 */
export const planKindChange = (
  locationId: string,
  placeTypes: IGeocodingPlaceType[],
  existing: Relation.IRelation[],
  conceptId: string | null,
): KindChange => {
  const kindConcepts = new Set(placeTypes.map((one) => one.conceptId).filter(Boolean));
  const ours = existing.filter(
    (relation) =>
      relation.type === RelationEnums.Type.Classification &&
      relation.entityIds[0] === locationId &&
      kindConcepts.has(relation.entityIds[1]),
  );
  const kept = conceptId ? ours.find((relation) => relation.entityIds[1] === conceptId) : undefined;
  return {
    create:
      conceptId && !kept
        ? {
            id: uuidv4(),
            type: RelationEnums.Type.Classification,
            entityIds: [locationId, conceptId],
          }
        : null,
    // a duplicate of the kept one goes too, so a Location is left with exactly one
    removeIds: ours.filter((relation) => relation !== kept).map((relation) => relation.id),
  };
};

/** The calls a kind change needs, named so a test can supply them without a server. */
export interface KindGateway {
  readClassifications: (locationId: string) => Promise<Relation.IRelation[]>;
  createRelation: (relation: Relation.IRelation) => Promise<void>;
  deleteRelation: (relationId: string) => Promise<void>;
}

export type KindOutcome = { ok: true; changed: boolean } | { ok: false; reason: string };

/**
 * Applies a kind change, the new Classification first.
 *
 * Created before the old ones are removed so a failure part-way leaves the
 * Location with a kind rather than none, and an extra one is a state the page
 * already reads (the first listed wins).
 */
export const executeKindChange = async (
  locationId: string,
  placeTypes: IGeocodingPlaceType[],
  conceptId: string | null,
  gateway: KindGateway,
): Promise<KindOutcome> => {
  let existing: Relation.IRelation[];
  try {
    existing = await gateway.readClassifications(locationId);
  } catch {
    return { ok: false, reason: "Could not read the location's current kind of place." };
  }
  const change = planKindChange(locationId, placeTypes, existing, conceptId);
  if (!change.create && !change.removeIds.length) {
    return { ok: true, changed: false };
  }
  if (change.create) {
    try {
      await gateway.createRelation(change.create);
    } catch {
      return { ok: false, reason: "The kind of place could not be saved." };
    }
  }
  for (const id of change.removeIds) {
    try {
      await gateway.deleteRelation(id);
    } catch {
      return {
        ok: false,
        reason: "The new kind of place was saved, but the previous one could not be removed.",
      };
    }
  }
  return { ok: true, changed: true };
};

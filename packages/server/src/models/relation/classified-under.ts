import { RelationEnums } from "@inkvisitor/shared/enums";
import {
  IClassifiedUnder,
  IResponseClassifiedUnder,
  Relation as RelationTypes,
} from "@inkvisitor/shared/types";
import { Conn } from "@service/storage";

import {
  SUBORDINATE_MAX_NODES,
  getEquivalentEntityIds,
  getSubordinateEntityIds,
} from "./functions";
import Relation from "./relation";

/**
 * Which entities are classified at or below a set of Concepts.
 *
 * Built for a caller that has a short list of Concepts it cares about (the
 * location types of a project) and wants to know, for every entity classified
 * anywhere near them, which of them it comes under and how, without learning the
 * Concept hierarchy itself.
 */

/**
 * The Concepts at or below `concept`: itself, its synonyms, its subclasses at
 * every level, and the synonyms of those.
 *
 * Only superclass and synonym links count. The walk the Explorer's "include
 * subordinates" makes also follows part-of and superordinate-entity links, which
 * would make a "settlement part" a settlement. The two steps are repeated until
 * nothing new turns up, since a synonym of a subclass has subclasses of its own.
 * It terminates on a cycle: the set only grows.
 *
 * The whole set is held to `SUBORDINATE_MAX_NODES`, the limit of the walk it is
 * built on, which applies to one pass only. `truncated` is true when the set
 * reached it, so that Concepts further down are missing; the set kept is the
 * nearest of what was found.
 */
export const getConceptsBelow = async (
  conn: Conn,
  concept: string
): Promise<{ below: Set<string>; truncated: boolean }> => {
  const synonymsOnly = { synonymsOnly: true };
  let known = new Set<string>([
    concept,
    ...(await getEquivalentEntityIds(conn, [concept], synonymsOnly)),
  ]);

  for (;;) {
    const subclasses = await getSubordinateEntityIds(conn, [...known], {
      relationTypes: [RelationEnums.Type.Superclass],
      includeChildTerritories: false,
    });
    const grown = new Set<string>([...known, ...subclasses]);
    for (const id of await getEquivalentEntityIds(conn, [...grown], synonymsOnly)) {
      grown.add(id);
    }
    if (grown.size >= SUBORDINATE_MAX_NODES) {
      return {
        below: new Set([...grown].slice(0, SUBORDINATE_MAX_NODES)),
        truncated: true,
      };
    }
    if (grown.size === known.size) {
      return { below: known, truncated: false };
    }
    known = grown;
  }
};

/**
 * Whether `entry` says more than `other` about the same Concept: being
 * classified under it directly beats reaching it through a subclass, a way that
 * is not shadowed beats one that is, and otherwise the lower id, so that the
 * answer does not depend on the order relations came back in.
 */
const saysMore = (entry: IClassifiedUnder, other: IClassifiedUnder): boolean => {
  if (entry.inferred !== other.inferred) {
    return !entry.inferred;
  }
  if (entry.shadowed !== other.shadowed) {
    return !entry.shadowed;
  }
  return entry.via < other.via;
};

/**
 * The entities classified under any of `concepts`, or under a subclass or a
 * synonym of one, and for each the Concepts it comes under.
 *
 * A Concept is shadowed for an entity when the entity is classified under one
 * Concept that was asked about and that lies below it, and not the other way
 * round: "city" shadows "settlement", while two Concepts that share a subclass
 * do not shadow each other, and two synonyms do not either. An entity's entry per
 * Concept is the best of its classifications that reach it.
 *
 * @param conn db connection
 * @param concepts the Concepts to ask about, in the order the result keeps
 */
export const getClassifiedUnder = async (
  conn: Conn,
  concepts: string[]
): Promise<IResponseClassifiedUnder> => {
  const asked = [...new Set(concepts.filter(Boolean))];
  const below = new Map<string, Set<string>>();
  const truncated: string[] = [];

  await Promise.all(
    asked.map(async (concept) => {
      const walked = await getConceptsBelow(conn, concept);
      below.set(concept, walked.below);
      if (walked.truncated) {
        truncated.push(concept);
      }
    })
  );

  const reachable = new Set<string>();
  below.forEach((set) => set.forEach((id) => reachable.add(id)));
  if (!reachable.size) {
    return { entities: {}, truncated };
  }

  // a Classification has the classified entity first and the Concept second
  const classifications = await Relation.findForEntities<RelationTypes.IClassification>(
    conn,
    [...reachable],
    RelationEnums.Type.Classification,
    1
  );
  const classifiedUnder = new Map<string, Set<string>>();
  for (const relation of classifications) {
    const [subject, via] = relation.entityIds;
    if (!classifiedUnder.has(subject)) {
      classifiedUnder.set(subject, new Set());
    }
    classifiedUnder.get(subject)!.add(via);
  }

  const entities: Record<string, IClassifiedUnder[]> = {};
  classifiedUnder.forEach((vias, subject) => {
    const best = new Map<string, IClassifiedUnder>();
    vias.forEach((via) => {
      const reached = asked.filter((concept) => below.get(concept)!.has(via));
      for (const concept of reached) {
        const entry: IClassifiedUnder = {
          concept,
          via,
          inferred: via !== concept,
          shadowed: reached.some(
            (other) =>
              other !== concept &&
              below.get(concept)!.has(other) &&
              !below.get(other)!.has(concept)
          ),
        };
        const known = best.get(concept);
        if (!known || saysMore(entry, known)) {
          best.set(concept, entry);
        }
      }
    });
    entities[subject] = asked
      .filter((concept) => best.has(concept))
      .map((concept) => best.get(concept)!);
  });

  return { entities, truncated };
};

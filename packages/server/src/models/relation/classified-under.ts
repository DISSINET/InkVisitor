import { RelationEnums } from "@inkvisitor/shared/enums";
import {
  IClassifiedUnder,
  IConceptTree,
  IResponseClassifiedUnder,
  Relation as RelationTypes,
} from "@inkvisitor/shared/types";
import { Conn } from "@service/storage";

import { SUBORDINATE_MAX_NODES } from "./functions";
import Relation from "./relation";

/**
 * Which entities are classified at or below a set of Concepts.
 *
 * Built for a caller that has a short list of Concepts it cares about (the
 * location types of a project) and wants to know, for every entity classified
 * anywhere near them, which of them it comes under and how, and the subclass
 * tree below each, so that it can place the entity within that tree.
 */

const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * The subclass tree below `concept`: its subclasses at every level as nodes, each
 * with all of its superclasses within the tree, and the synonyms of every node as
 * aliases of it.
 *
 * Only superclass and synonym links count. The walk the Explorer's "include
 * subordinates" makes also follows part-of and superordinate-entity links, which
 * would make a "settlement part" a settlement. A subclass of a synonym is a
 * subclass of the node the synonym stands beside, and a synonym cloud that was
 * saved in pieces is followed until no piece adds anything.
 *
 * One superclass query and one synonym query per level, the level read in id
 * order so that which node a shared synonym joins does not depend on the order
 * relations came back in. A parent edge that would close a cycle is dropped, so
 * the parents of every node lead to `concept`.
 *
 * Nodes and aliases together are held to `SUBORDINATE_MAX_NODES`; `truncated`
 * is true when the walk stopped there, so that Concepts further down are missing.
 */
export const getConceptTree = async (
  conn: Conn,
  concept: string
): Promise<{ tree: IConceptTree; below: Set<string>; truncated: boolean }> => {
  const parents = new Map<string, Set<string>>([[concept, new Set()]]);
  const aliases: Record<string, string> = {};
  const seen = new Set<string>([concept]);
  let truncated = false;

  const nodeOf = (id: string): string | undefined => (parents.has(id) ? id : aliases[id]);

  const isAncestor = (candidate: string, of: string): boolean => {
    const stack = [of];
    const visited = new Set<string>();
    while (stack.length) {
      const id = stack.pop()!;
      if (id === candidate) {
        return true;
      }
      if (!visited.has(id)) {
        visited.add(id);
        stack.push(...(parents.get(id) ?? []));
      }
    }
    return false;
  };

  /** Makes every unseen member of a synonym relation of `ids` an alias, until no relation adds one. */
  const takeSynonyms = async (ids: string[]): Promise<string[]> => {
    const added: string[] = [];
    let frontier = ids;
    while (frontier.length && !truncated) {
      const relations = await Relation.findForEntities<RelationTypes.IRelation>(
        conn,
        frontier,
        RelationEnums.Type.Synonym
      );
      const next: string[] = [];
      for (const relation of [...relations].sort(byId)) {
        const anchor = relation.entityIds.map(nodeOf).find((id): id is string => !!id);
        if (!anchor) {
          continue;
        }
        for (const member of relation.entityIds) {
          if (seen.has(member)) {
            continue;
          }
          if (seen.size >= SUBORDINATE_MAX_NODES) {
            truncated = true;
            break;
          }
          seen.add(member);
          aliases[member] = anchor;
          added.push(member);
          next.push(member);
        }
      }
      frontier = next;
    }
    return added;
  };

  let frontier = [concept, ...(await takeSynonyms([concept]))];
  while (frontier.length && !truncated) {
    // a superclass relation has the subclass first and the superclass second
    const relations = await Relation.findForEntities<RelationTypes.IRelation>(
      conn,
      frontier,
      RelationEnums.Type.Superclass,
      1
    );
    const found: string[] = [];
    for (const relation of [...relations].sort(byId)) {
      const [child, superclass] = relation.entityIds;
      const parent = nodeOf(superclass);
      if (!parent || child === concept || nodeOf(child) === parent) {
        continue;
      }
      // a node already in the tree, or a synonym of one, which reads as that
      // node: the superclass is one more parent of it. The Concept asked has none
      const node = nodeOf(child);
      if (node && node !== concept) {
        if (!isAncestor(node, parent)) {
          parents.get(node)!.add(parent);
        }
        continue;
      }
      if (seen.has(child)) {
        // the Concept asked, or a synonym of it
        continue;
      }
      if (seen.size >= SUBORDINATE_MAX_NODES) {
        truncated = true;
        break;
      }
      seen.add(child);
      parents.set(child, new Set([parent]));
      found.push(child);
    }
    frontier = [...found, ...(await takeSynonyms(found))];
  }

  return {
    tree: {
      nodes: [...parents.entries()].map(([id, of]) => ({ id, parents: [...of].sort() })),
      aliases,
    },
    below: seen,
    truncated,
  };
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
  const trees: Record<string, IConceptTree> = {};
  const truncated: string[] = [];

  await Promise.all(
    asked.map(async (concept) => {
      const walked = await getConceptTree(conn, concept);
      below.set(concept, walked.below);
      trees[concept] = walked.tree;
      if (walked.truncated) {
        truncated.push(concept);
      }
    })
  );

  const reachable = new Set<string>();
  below.forEach((set) => set.forEach((id) => reachable.add(id)));
  if (!reachable.size) {
    return { entities: {}, truncated, trees, classifiedAs: {} };
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
  const classifiedAs: Record<string, string[]> = {};
  classifiedUnder.forEach((vias, subject) => {
    classifiedAs[subject] = [...vias].sort();
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

  return { entities, truncated, trees, classifiedAs };
};

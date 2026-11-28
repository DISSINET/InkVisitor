import { IClassifiedUnder, IConceptTree, IResponseClassifiedUnder } from "@inkvisitor/shared/types";
import { IGeocodingPlaceType } from "@inkvisitor/shared/types/geocoding";

/**
 * A project's location types with the subclass tree of each.
 *
 * The settings store one entry per location type: its Concept, mark, gazetteer
 * location type and the Concepts of its tree that are deactivated. The tree itself is
 * read from the superclass relations every time, so a subclass added later is
 * a location type of its own without anyone editing the settings. Every Concept
 * of a tree becomes a node: a location type that shares the mark, gazetteer
 * location type and favourite of the one at its root.
 */

/** One location type: the one a project set up, or a Concept of its subclass tree. */
export interface PlaceTypeNode extends IGeocodingPlaceType {
  /** The id of the location type the project set up, which is this node's own id for a root. */
  rootId: string;
  /** The nodes of the same tree this one is a subclass of; empty for a root. */
  parentIds: string[];
  /** Levels below the root along the shortest way; 0 for a root. */
  depth: number;
  /** Offered for a new assignment. */
  active: boolean;
  /** The Concept's detail. */
  description: string;
}

/** What a node needs of its Concept. */
export interface TypeConcept {
  label: string;
  detail: string;
}

/** The id of a node that is not a root: stable for as long as the Concept stays in the tree. */
export const nodeIdOf = (rootId: string, conceptId: string): string => `${rootId}~${conceptId}`;

export const isRootNode = (type: IGeocodingPlaceType): boolean =>
  !("rootId" in type) || (type as PlaceTypeNode).rootId === type.id;

/** The location types a project set up, out of a list that may hold their trees too. */
export const rootsOf = <T extends IGeocodingPlaceType>(types: T[]): T[] => types.filter(isRootNode);

// a location type is called by its Concept's label; the stored name is what it
// is called while it has no Concept, or until the label is in
const rootNode = (
  root: IGeocodingPlaceType,
  concepts: Record<string, TypeConcept>
): PlaceTypeNode => ({
  ...root,
  name: (root.conceptId && concepts[root.conceptId]?.label) || root.name,
  rootId: root.id,
  parentIds: [],
  depth: 0,
  active: !root.inactive.includes(root.conceptId),
  description: (root.conceptId && concepts[root.conceptId]?.detail) || "",
});

/**
 * Every location type with its tree, in the order the settings list them and,
 * within a tree, depth first with each level sorted by label.
 *
 * A Concept that is another location type's own Concept is left out of the
 * tree, with whatever lies below it only through it: it is that location type,
 * and its tree is drawn there. A node with two superclasses in the tree is one
 * node with two parents; it is listed once, where it is first reached.
 */
export const expandPlaceTypes = (
  roots: IGeocodingPlaceType[],
  trees: Record<string, IConceptTree>,
  concepts: Record<string, TypeConcept>
): PlaceTypeNode[] => {
  const rootConcepts = new Set(roots.map((one) => one.conceptId).filter(Boolean));
  const out: PlaceTypeNode[] = [];

  for (const root of roots) {
    const top = rootNode(root, concepts);
    out.push(top);
    const tree = root.conceptId ? trees[root.conceptId] : undefined;
    if (!tree) {
      continue;
    }

    const children = new Map<string, string[]>();
    for (const node of tree.nodes) {
      for (const parent of node.parents) {
        children.set(parent, [...(children.get(parent) ?? []), node.id]);
      }
    }
    const label = (id: string) => concepts[id]?.label ?? "";
    const byLabel = (a: string, b: string) => label(a).localeCompare(label(b)) || (a < b ? -1 : 1);

    // the Concepts reachable from the root without passing through another
    // location type's own Concept, with the shortest depth of each
    const depth = new Map<string, number>([[root.conceptId, 0]]);
    let level = [root.conceptId];
    while (level.length) {
      const next: string[] = [];
      for (const id of level) {
        for (const child of children.get(id) ?? []) {
          if (!depth.has(child) && !rootConcepts.has(child)) {
            depth.set(child, depth.get(id)! + 1);
            next.push(child);
          }
        }
      }
      level = next;
    }

    const parentsOf = new Map(tree.nodes.map((node) => [node.id, node.parents]));
    const visited = new Set<string>([root.conceptId]);
    const visit = (conceptId: string) => {
      for (const child of [...(children.get(conceptId) ?? [])]
        .filter((id) => depth.has(id))
        .sort(byLabel)) {
        if (visited.has(child)) {
          continue;
        }
        visited.add(child);
        out.push({
          ...root,
          id: nodeIdOf(root.id, child),
          name: label(child),
          conceptId: child,
          favorite: false,
          rootId: root.id,
          parentIds: (parentsOf.get(child) ?? [])
            .filter((parent) => depth.has(parent))
            .map((parent) => (parent === root.conceptId ? root.id : nodeIdOf(root.id, parent))),
          depth: depth.get(child)!,
          active: !root.inactive.includes(child),
          description: concepts[child]?.detail ?? "",
        });
        visit(child);
      }
    };
    visit(root.conceptId);
  }
  return out;
};

/** The nodes directly below each node, by node id, sorted by name under every parent. */
export const childrenOf = (nodes: PlaceTypeNode[]): Map<string, PlaceTypeNode[]> => {
  const map = new Map<string, PlaceTypeNode[]>();
  for (const node of nodes) {
    for (const parent of node.parentIds) {
      map.set(parent, [...(map.get(parent) ?? []), node]);
    }
  }
  map.forEach((children) =>
    children.sort((a, b) => a.name.localeCompare(b.name) || (a.id < b.id ? -1 : 1)),
  );
  return map;
};

/** One location type a Location comes under, and how. */
export interface LocationTypeEntry {
  /** The location type, a root or a node of its tree. */
  typeId: string;
  /** False exactly when the Location is classified under the type's own Concept. */
  inferred: boolean;
  /** The Concept the Location is classified under, which is the type's own unless `inferred`. */
  via: string;
  /**
   * Not shown: another of the project's location types lies below this one on
   * the same classification, so the Location is better described by that one.
   */
  shadowed: boolean;
  /**
   * The Location comes under this type through a deeper node of the same tree
   * that it also has. Not shown, but counted and matched by a filter on this
   * type: a road is a path.
   */
  underNode: boolean;
}

/** Whether an entry stands for a Location of that type, for counts and filters. */
export const entryApplies = (entry: LocationTypeEntry): boolean =>
  !entry.shadowed || entry.underNode;

const rank = (entry: LocationTypeEntry) => (entry.shadowed ? 2 : entry.inferred ? 1 : 0);

/**
 * The location types of every entity the server answered for: the deepest
 * nodes it is classified under, shown, and the nodes above them, not shown but
 * applying.
 *
 * The server says, per location type at a root, whether the entity comes under
 * it and whether another root shadows it, and lists every Concept of the trees
 * the entity is classified under. Where a tree is not in the answer (a Concept
 * assigned since it was asked), the entity reads as the root, the way the
 * server's own entry has it.
 */
export const deriveTypeEntries = (
  nodes: PlaceTypeNode[],
  response: IResponseClassifiedUnder
): Map<string, LocationTypeEntry[]> => {
  const roots = rootsOf(nodes);
  const byRoot = new Map<string, PlaceTypeNode[]>();
  for (const node of nodes) {
    byRoot.set(node.rootId, [...(byRoot.get(node.rootId) ?? []), node]);
  }
  const order = new Map(nodes.map((node, index) => [node.id, index]));
  const result = new Map<string, LocationTypeEntry[]>();

  for (const [entityId, answered] of Object.entries(response.entities)) {
    const entries: LocationTypeEntry[] = [];
    const classifiedAs = response.classifiedAs?.[entityId] ?? answered.map((one) => one.via);

    for (const root of roots) {
      const asRoot: IClassifiedUnder | undefined = answered.find(
        (one) => root.conceptId && one.concept === root.conceptId
      );
      if (!asRoot) {
        continue;
      }
      const members = byRoot.get(root.id) ?? [root];
      const tree = response.trees?.[root.conceptId];
      const byConcept = new Map(members.map((node) => [node.conceptId, node]));
      const nodeFor = (concept: string) =>
        byConcept.get(concept) ?? (tree ? byConcept.get(tree.aliases[concept]) : undefined);

      const mapped = new Map<string, { node: PlaceTypeNode; via: string }>();
      if (tree) {
        // classified under the node's own Concept says more than under its synonym
        for (const concept of classifiedAs) {
          const node = nodeFor(concept);
          const known = node ? mapped.get(node.id) : undefined;
          if (node && (!known || (concept === node.conceptId && known.via !== node.conceptId))) {
            mapped.set(node.id, { node, via: concept });
          }
        }
      }
      if (!mapped.size) {
        entries.push({
          typeId: root.id,
          inferred: asRoot.inferred,
          via: asRoot.via,
          shadowed: asRoot.shadowed,
          underNode: false,
        });
        continue;
      }

      const byId = new Map(members.map((node) => [node.id, node]));
      const ancestorsOf = (id: string): Set<string> => {
        const found = new Set<string>();
        const stack = [...(byId.get(id)?.parentIds ?? [])];
        while (stack.length) {
          const next = stack.pop()!;
          if (!found.has(next)) {
            found.add(next);
            stack.push(...(byId.get(next)?.parentIds ?? []));
          }
        }
        return found;
      };

      const above = new Map<string, string>();
      for (const { node, via } of mapped.values()) {
        for (const ancestor of ancestorsOf(node.id)) {
          if (!above.has(ancestor)) {
            above.set(ancestor, via);
          }
        }
      }
      for (const { node, via } of mapped.values()) {
        const lower = above.has(node.id);
        entries.push({
          typeId: node.id,
          inferred: via !== node.conceptId,
          via,
          shadowed: asRoot.shadowed || lower,
          underNode: lower && !asRoot.shadowed,
        });
      }
      for (const [ancestor, via] of above) {
        if (!mapped.has(ancestor)) {
          entries.push({
            typeId: ancestor,
            inferred: true,
            via,
            shadowed: true,
            underNode: !asRoot.shadowed,
          });
        }
      }
    }

    if (entries.length) {
      result.set(
        entityId,
        entries
          .map((entry) => ({ entry, index: order.get(entry.typeId) ?? 0 }))
          .sort((a, b) => rank(a.entry) - rank(b.entry) || a.index - b.index)
          .map(({ entry }) => entry)
      );
    }
  }
  return result;
};

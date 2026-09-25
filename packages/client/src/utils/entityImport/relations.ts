import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity, Relation } from "@inkvisitor/shared/types";
import { v4 as uuidv4 } from "uuid";
import {
  className,
  enumList,
  isEnumValue,
  isEntityClass,
  isNonEmptyString,
  isPlainObject,
  quote,
  unique,
} from "./helpers";
import { EdgeGraph, addForwardEdges, loadForwardClosure } from "./relationGraph";
import { ImportDataSource, ImportEntity, ImportIssue, ImportRelationItem } from "./types";

const RELATION_KEYS = ["type", "entityIds", "id", "order", "certainty", "subtrees"];

// Tree types whose edges chain within the type: a Superclass of a Superclass
const CHAIN_TYPES = [
  RelationEnums.Type.Superclass,
  RelationEnums.Type.SuperordinateEntity,
  RelationEnums.Type.Holonym,
  RelationEnums.Type.Implication,
];
// Tree types whose tree continues through the Superclass tree of their target
// concept, as Detail shows it (getSuperclassTrees on the server)
const SUPERCLASS_FOLLOWED_TYPES = [
  RelationEnums.Type.Classification,
  RelationEnums.Type.ActionEventEquivalent,
];

const ruleOf = (type: RelationEnums.Type) => Relation.RelationRules[type]!;

/**
 * Reads the "relations" list of every input entity into relation objects,
 * checking only what needs no knowledge of the entities involved.
 */
export const normalizeRelationItems = (
  entities: ImportEntity[]
): { items: ImportRelationItem[]; errors: ImportIssue[]; notes: ImportIssue[] } => {
  const items: ImportRelationItem[] = [];
  const errors: ImportIssue[] = [];
  const notes: ImportIssue[] = [];

  for (const { index, entity, rawRelations } of entities) {
    rawRelations.forEach(({ path, raw }) => {
      const issue = (subPath: string, message: string): ImportIssue => ({
        entityIndex: index,
        label: entity.labels[0],
        path: `${path}${subPath}`,
        message,
      });
      const errorCountBefore = errors.length;

      if (!isPlainObject(raw)) {
        errors.push(issue("", 'must be an object with "type" and "entityIds"'));
        return;
      }

      Object.keys(raw)
        .filter((key) => !RELATION_KEYS.includes(key))
        .forEach((key) => errors.push(issue(`.${key}`, "unknown field")));

      const type = raw.type;
      if (!isEnumValue(RelationEnums.Type, type)) {
        errors.push(
          issue(".type", `must be one of ${enumList(RelationEnums.Type)}; got ${quote(type)}`)
        );
        return;
      }
      const rule = ruleOf(type);

      const entityIds = raw.entityIds;
      if (!Array.isArray(entityIds) || !entityIds.every(isNonEmptyString)) {
        errors.push(issue(".entityIds", "must be a list of entity ids"));
      } else if (rule.cloudType ? entityIds.length < 2 : entityIds.length !== 2) {
        errors.push(
          issue(
            ".entityIds",
            rule.cloudType
              ? `${rule.label} needs at least 2 entity ids`
              : `${rule.label} needs exactly 2 entity ids`
          )
        );
      }

      let certainty = EntityEnums.Certainty.Certain;
      if (raw.certainty !== undefined) {
        if (type !== RelationEnums.Type.Identification) {
          errors.push(issue(".certainty", "only an Identification has a certainty"));
        } else if (isEnumValue(EntityEnums.Certainty, raw.certainty)) {
          certainty = raw.certainty;
        } else {
          errors.push(
            issue(
              ".certainty",
              `must be one of ${enumList(EntityEnums.Certainty)}; got ${quote(raw.certainty)}`
            )
          );
        }
      }

      if (Array.isArray(raw.subtrees) && raw.subtrees.length > 0) {
        notes.push(
          issue(".subtrees", "ignored; the app shows the rest of the tree on its own")
        );
      }

      if (errors.length > errorCountBefore) {
        return;
      }

      // the id and order of the input are not reused: relation ids are
      // generated anew and the server orders relations on its own
      const relation: Relation.IRelation =
        type === RelationEnums.Type.Identification
          ? ({
              id: uuidv4(),
              type,
              entityIds: entityIds as string[],
              certainty,
            } as Relation.IIdentification)
          : { id: uuidv4(), type, entityIds: entityIds as string[] };

      items.push({ ownerIndex: index, path, relation });
    });
  }

  return { items, errors, notes };
};

/** Whether the classes of a relation fit one of the patterns of its type. */
const classPatternError = (
  rule: Relation.RelationRule,
  classes: EntityEnums.Class[]
): string | null => {
  const disabled = classes.filter((entityClass) => rule.disabledEntities?.includes(entityClass));
  if (disabled.length) {
    return `${rule.label} can't link ${unique(disabled).map(className).join(" or ")} entities`;
  }
  if (rule.allowedEntitiesPattern.length === 0) {
    return null;
  }

  const fits = rule.allowedEntitiesPattern.some((pattern) =>
    rule.cloudType
      ? classes.every((entityClass) => entityClass === pattern[0])
      : pattern.length === classes.length &&
        pattern.every((entityClass, position) => entityClass === classes[position])
  );
  if (fits) {
    return null;
  }

  const separator = rule.asymmetrical ? " → " : " – ";
  const allowed = rule.allowedEntitiesPattern
    .map((pattern) =>
      rule.cloudType
        ? `${className(pattern[0])} only`
        : pattern.map(className).join(separator)
    )
    .join(", ");
  return `${rule.label} links ${allowed}; got ${classes.map(className).join(separator)}`;
};

interface RelationEntry {
  item: ImportRelationItem;
  relation: Relation.IRelation;
}

interface TreeEdge {
  from: string;
  to: string;
  entry: RelationEntry;
}

/**
 * Checks the relations against the entities they link and the relations
 * already in the database, and settles which relations get created:
 * duplicates merge, synonym groups sharing a member merge, and tree edges the
 * rest of the tree already implies are dropped (only the first level of a
 * tree is stored; the app derives the rest when it shows the tree).
 */
export const validateRelations = async (
  items: ImportRelationItem[],
  entities: ImportEntity[],
  existing: Map<string, IEntity>,
  source: Pick<ImportDataSource, "getForwardRelations">
): Promise<{ relations: Relation.IRelation[]; errors: ImportIssue[]; notes: ImportIssue[] }> => {
  const errors: ImportIssue[] = [];
  const notes: ImportIssue[] = [];

  const batch = new Map(entities.map((item) => [item.entity.id, item]));
  const byIndex = new Map(entities.map((item) => [item.index, item]));
  const isNew = (entityId: string) => batch.has(entityId);
  const entityOf = (entityId: string) => batch.get(entityId)?.entity ?? existing.get(entityId);
  const labelOf = (entityId: string) => quote(entityOf(entityId)?.labels[0] ?? entityId);

  const issue = (item: ImportRelationItem, message: string, subPath = ""): ImportIssue => ({
    entityIndex: item.ownerIndex,
    label: byIndex.get(item.ownerIndex)?.entity.labels[0],
    path: `${item.path}${subPath}`,
    message,
  });

  const describe = ({ type, entityIds }: Relation.IRelation) => {
    const rule = ruleOf(type);
    return rule.asymmetrical
      ? `${rule.label} ${entityIds.map(labelOf).join(" → ")}`
      : `${rule.label} ${entityIds.map(labelOf).join(", ")}`;
  };

  // 1. each relation on its own
  const accepted: ImportRelationItem[] = [];
  for (const item of items) {
    const { type, entityIds } = item.relation;
    const rule = ruleOf(type);
    const owner = byIndex.get(item.ownerIndex)!;

    const missing = entityIds.filter((entityId) => !isNew(entityId) && !existing.has(entityId));
    if (missing.length) {
      missing.forEach((entityId) =>
        errors.push(
          issue(item, `UUID ${quote(entityId)} not found in the database or the input`, ".entityIds")
        )
      );
      continue;
    }

    const template = entityIds.find((entityId) => !isNew(entityId) && existing.get(entityId)!.isTemplate);
    if (template) {
      errors.push(
        issue(item, `${labelOf(template)} is a template; templates can't be linked`, ".entityIds")
      );
      continue;
    }

    if (!rule.selfLoop && new Set(entityIds).size !== entityIds.length) {
      errors.push(issue(item, `${rule.label} can't link an entity to itself`, ".entityIds"));
      continue;
    }

    // a directional relation belongs to the entity it starts at, and Detail
    // sets it only there, so the import never adds one to an existing entity
    if (rule.asymmetrical && !isNew(entityIds[0])) {
      notes.push(
        issue(
          item,
          `${describe(item.relation)}: ignored, ${labelOf(entityIds[0])} is an existing entity; add it in its Detail`
        )
      );
      continue;
    }
    if (!rule.treeType && !entityIds.includes(owner.entity.id)) {
      errors.push(issue(item, "must include the id of this entity", ".entityIds"));
      continue;
    }

    const classes = entityIds.map((entityId) => entityOf(entityId)!.class);
    // an entity with an invalid class is already reported by the entity checks
    if (classes.every(isEntityClass)) {
      const classError = classPatternError(rule, classes);
      if (classError) {
        errors.push(issue(item, classError, ".entityIds"));
        continue;
      }
    }

    accepted.push(item);
  }

  // 2. merge duplicates and synonym groups that share a member
  const synonymGroups: { ids: Set<string>; items: ImportRelationItem[] }[] = [];
  for (const item of accepted.filter((item) => item.relation.type === RelationEnums.Type.Synonym)) {
    const overlapping = synonymGroups.filter((group) =>
      item.relation.entityIds.some((entityId) => group.ids.has(entityId))
    );
    const merged = {
      ids: new Set([...overlapping.flatMap((group) => [...group.ids]), ...item.relation.entityIds]),
      items: [...overlapping.flatMap((group) => group.items), item],
    };
    overlapping.forEach((group) => synonymGroups.splice(synonymGroups.indexOf(group), 1));
    synonymGroups.push(merged);
  }

  const entries: RelationEntry[] = [];
  const seenKeys = new Map<string, ImportRelationItem>();
  for (const item of accepted) {
    const { type, entityIds } = item.relation;

    if (type === RelationEnums.Type.Synonym) {
      const group = synonymGroups.find((candidate) => candidate.items.includes(item))!;
      const firstItem = accepted.find((candidate) => group.items.includes(candidate))!;
      if (firstItem !== item) {
        continue;
      }
      const relation: Relation.IRelation = { id: uuidv4(), type, entityIds: [...group.ids] };
      if (group.items.length > 1) {
        notes.push(
          issue(item, `synonym relations merged into one group: ${relation.entityIds.map(labelOf).join(", ")}`)
        );
      }
      entries.push({ item, relation });
      continue;
    }

    const key = `${type}:${
      ruleOf(type).asymmetrical ? entityIds.join(">") : [...entityIds].sort().join("|")
    }`;
    const first = seenKeys.get(key);
    if (first) {
      notes.push(
        issue(item, `duplicate of ${first.path} of entity ${first.ownerIndex}, merged into it`)
      );
      continue;
    }
    seenKeys.set(key, item);
    entries.push({ item, relation: item.relation });
  }

  // 3. tree edges, with the database edges around them
  const treeEdges = new Map<RelationEnums.Type, TreeEdge[]>();
  for (const entry of entries) {
    if (ruleOf(entry.relation.type).treeType) {
      const edges = treeEdges.get(entry.relation.type) ?? [];
      edges.push({ from: entry.relation.entityIds[0], to: entry.relation.entityIds[1], entry });
      treeEdges.set(entry.relation.type, edges);
    }
  }
  const edgesOf = (type: RelationEnums.Type) => treeEdges.get(type) ?? [];
  const fetchForward = source.getForwardRelations;

  // first level of Classification / Action-event equivalent: the edges the
  // existing sources already have, and those plus the input edges
  const databaseFirstHopGraphs = new Map<RelationEnums.Type, EdgeGraph>();
  const firstHopGraphs = new Map<RelationEnums.Type, EdgeGraph>();
  for (const type of SUPERCLASS_FOLLOWED_TYPES) {
    const databaseGraph = new EdgeGraph();
    const existingSources = unique(edgesOf(type).map(({ from }) => from)).filter(
      (entityId) => !isNew(entityId)
    );
    await Promise.all(
      existingSources.map((entityId) =>
        addForwardEdges(databaseGraph, type, entityId, fetchForward)
      )
    );
    databaseFirstHopGraphs.set(type, databaseGraph);

    const graph = new EdgeGraph();
    edgesOf(type).forEach(({ from, to }) => graph.addEdge(from, to));
    existingSources.forEach((entityId) =>
      databaseGraph.successors(entityId).forEach((target) => graph.addEdge(entityId, target))
    );
    firstHopGraphs.set(type, graph);
  }

  const chainGraphs = new Map<RelationEnums.Type, EdgeGraph>();
  for (const type of CHAIN_TYPES) {
    const graph = new EdgeGraph();
    const startIds = edgesOf(type).flatMap(({ from, to }) => [from, to]);
    edgesOf(type).forEach(({ from, to }) => graph.addEdge(from, to));
    if (type === RelationEnums.Type.Superclass) {
      for (const followedType of SUPERCLASS_FOLLOWED_TYPES) {
        edgesOf(followedType).forEach(({ from }) =>
          startIds.push(...firstHopGraphs.get(followedType)!.successors(from))
        );
      }
    }
    if (startIds.length) {
      await loadForwardClosure(graph, type, startIds, isNew, fetchForward);
    }
    chainGraphs.set(type, graph);
  }

  // 4. loops: a new edge from → to closes one when `from` is reachable from `to`
  const typesWithLoops = new Set<RelationEnums.Type>();
  for (const type of CHAIN_TYPES) {
    const graph = chainGraphs.get(type)!;
    const reportedLoops = new Set<string>();

    for (const edge of edgesOf(type)) {
      const back = graph.findPath(edge.to, edge.from);
      if (!back) {
        continue;
      }
      const loop = [edge.from, ...back];
      const loopKey = unique(loop).sort().join("|");
      if (reportedLoops.has(loopKey)) {
        continue;
      }
      reportedLoops.add(loopKey);
      typesWithLoops.add(type);

      const lines = loop.slice(0, -1).map((node, position) => {
        const next = loop[position + 1];
        const inputEdge = edgesOf(type).find(({ from, to }) => from === node && to === next);
        const origin = inputEdge ? `JSON, entity ${inputEdge.entry.item.ownerIndex}` : "database";
        return `  ${labelOf(node)} → ${labelOf(next)}   (${origin})`;
      });
      errors.push({ message: `${ruleOf(type).label} loop:\n${lines.join("\n")}` });
    }
  }

  // 5. keep the first level only: an edge is dropped when its target is
  // reachable through another edge of the same source
  const dropped = new Set<RelationEntry>();
  const dropImplied = (edge: TreeEdge, firstHop: EdgeGraph, tree: EdgeGraph) => {
    for (const via of firstHop.successors(edge.from)) {
      if (via !== edge.to && tree.findPath(via, edge.to)) {
        dropped.add(edge.entry);
        notes.push(
          issue(
            edge.entry.item,
            `${describe(edge.entry.relation)}: ignored, already implied via ${labelOf(via)}`
          )
        );
        return;
      }
    }
  };
  for (const type of CHAIN_TYPES) {
    if (!typesWithLoops.has(type)) {
      const graph = chainGraphs.get(type)!;
      edgesOf(type).forEach((edge) => dropImplied(edge, graph, graph));
    }
  }
  if (!typesWithLoops.has(RelationEnums.Type.Superclass)) {
    for (const type of SUPERCLASS_FOLLOWED_TYPES) {
      edgesOf(type).forEach((edge) =>
        dropImplied(edge, firstHopGraphs.get(type)!, chainGraphs.get(RelationEnums.Type.Superclass)!)
      );
    }
  }

  const kept = entries.filter((entry) => !dropped.has(entry));

  // 6. types that allow a single relation per entity; synonyms are exempt, the
  // server merges their groups instead. Of these, only the asymmetrical Action
  // event equivalent can meet a relation of an existing entity in the database.
  const relationCounts = new Map<string, number>();
  for (const entry of kept) {
    const { type, entityIds } = entry.relation;
    const rule = ruleOf(type);
    if (rule.multiple || rule.cloudType) {
      continue;
    }
    const countedIds = rule.asymmetrical ? [entityIds[0]] : unique(entityIds.filter(isNew));
    for (const entityId of countedIds) {
      const key = `${type}:${entityId}`;
      const previous =
        relationCounts.get(key) ??
        databaseFirstHopGraphs.get(type)?.successors(entityId).length ??
        0;
      relationCounts.set(key, previous + 1);
      if (previous + 1 === 2) {
        errors.push(
          issue(
            entry.item,
            `${labelOf(entityId)} can have only one ${rule.label} relation`,
            ".entityIds"
          )
        );
      }
    }
  }

  // 7. new synonyms joining synonym groups already in the database
  await Promise.all(
    kept
      .filter((entry) => entry.relation.type === RelationEnums.Type.Synonym)
      .map(async (entry) => {
        const members = entry.relation.entityIds.filter((entityId) => !isNew(entityId));
        const groups = (
          await Promise.all(
            members.map((entityId) => fetchForward(entityId, RelationEnums.Type.Synonym))
          )
        ).flat();
        if (groups.length) {
          const joined = unique(groups.flatMap((group) => group.entityIds));
          notes.push(
            issue(
              entry.item,
              `${describe(entry.relation)}: joins the synonyms already in the database (${joined.length} entities in all)`
            )
          );
        }
      })
  );

  return { relations: kept.map((entry) => entry.relation), errors, notes };
};

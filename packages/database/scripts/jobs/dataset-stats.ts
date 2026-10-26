import { EntityEnums } from "@inkvisitor/shared/enums";
import {
  IAudit,
  IEntity,
  IProp,
  Relation as RelationTypes,
} from "@inkvisitor/shared/types";
import { EventType } from "@inkvisitor/shared/types/stats";

/**
 * Statistics and static validation over an exported dataset (a set of
 * entities, the relations between them and the audits that concern them).
 *
 * The numbers here are published alongside the data - entity and relation
 * composition tell a reader what the dataset covers, and the per-user audit
 * shares are what an authorship list is derived from - so they are computed
 * from the arrays that were actually written, never from the arrays the
 * exporting job assembled on the way.
 */

/** One row of a count table: how many, and what share of the whole. */
export interface StatRow {
  key: string;
  label: string;
  count: number;
  share: number;
}

/** One row of the authorship table, split by the kind of edit. */
export interface AuthorshipRow {
  user: string;
  label: string;
  creates: number;
  createsShare: number;
  edits: number;
  editsShare: number;
  total: number;
  totalShare: number;
}

/**
 * A reference the dataset makes to an id it does not contain. The carrier is
 * reported so the entity can be found in the app by id or label.
 */
export interface DanglingRef {
  kind: string;
  carrierId: string;
  carrierClass: string;
  carrierLabel: string;
  missingId: string;
}

/**
 * Why one endpoint of a metaprop kept it out of the dataset.
 *
 * - `present`      the endpoint is in the dataset
 * - `outOfScope`   it exists in the source database but its class is not covered
 * - `unfinished`   the prop carries no id here at all, i.e. an editor left it incomplete
 * - `absent`       an id is set but no such entity exists in the source database
 *
 * The three failing states need different responses: `outOfScope` is the scope
 * working as designed, `unfinished` is ordinary editorial work in progress, and
 * `absent` is data loss.
 */
export type EndpointState =
  | "present"
  | "outOfScope"
  | "unfinished"
  | "absent";

/** A metaprop the dataset could not carry, with both endpoints named. */
export interface DroppedProp {
  carrierId: string;
  carrierClass: string;
  carrierLabel: string;
  propId: string;
  typeId: string;
  typeClass: string;
  typeLabel: string;
  typeState: EndpointState;
  valueId: string;
  valueClass: string;
  valueLabel: string;
  valueState: EndpointState;
}

const STATE_SEVERITY: EndpointState[] = [
  "absent",
  "unfinished",
  "outOfScope",
  "present",
];

/** The worse of a prop's two endpoint states - what the prop is grouped under. */
export const droppedPropGroup = (prop: DroppedProp): EndpointState =>
  STATE_SEVERITY.find(
    (state) => prop.typeState === state || prop.valueState === state
  ) ?? "present";

export interface DatasetStats {
  entityCount: number;
  distinctEntityIds: number;
  entityClasses: StatRow[];
  relationCount: number;
  relationTypes: StatRow[];
  auditCount: number;
  authorship: AuthorshipRow[];
  auditedEntities: number;
  unauditedEntities: number;
  dangling: DanglingRef[];
  droppedProps: DroppedProp[];
  problems: string[];
}

const percent = (part: number, whole: number): number =>
  whole ? (100 * part) / whole : 0;

export const firstLabel = (entity?: {
  labels?: string[];
  label?: string;
}): string => entity?.labels?.[0] ?? entity?.label ?? "";

/** Walks a prop tree, yielding parents before their children. */
export function* walkProps(props?: IProp[]): Generator<IProp> {
  for (const prop of props ?? []) {
    yield prop;
    yield* walkProps(prop.children);
  }
}

/**
 * Counts items by a key and adds each key's share, largest first. Ties keep
 * the key order so repeated runs over the same data render identically.
 */
export function countBy<T>(
  items: T[],
  key: (item: T) => string,
  label: (key: string) => string = (k) => k
): StatRow[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([k, count]) => ({
      key: k,
      label: label(k),
      count,
      share: percent(count, items.length),
    }));
}

const CLASS_NAMES: Record<string, string> = {
  [EntityEnums.Class.Action]: "Action",
  [EntityEnums.Class.Territory]: "Territory",
  [EntityEnums.Class.Statement]: "Statement",
  [EntityEnums.Class.Resource]: "Resource",
  [EntityEnums.Class.Person]: "Person",
  [EntityEnums.Class.Being]: "Being",
  [EntityEnums.Class.Group]: "Group",
  [EntityEnums.Class.Object]: "Object",
  [EntityEnums.Class.Concept]: "Concept",
  [EntityEnums.Class.Location]: "Location",
  [EntityEnums.Class.Value]: "Value",
  [EntityEnums.Class.Event]: "Event",
};

export const entityClassStats = (entities: IEntity[]): StatRow[] =>
  countBy(
    entities,
    (e) => e.class,
    (k) => CLASS_NAMES[k] ?? k
  );

export const relationTypeStats = (
  relations: RelationTypes.IRelation[]
): StatRow[] => countBy(relations, (r) => r.type);

/**
 * Per-user counts of creations and edits. Every audit type other than
 * `create` counts as an edit, so a new audit type cannot silently vanish from
 * the totals. Users are named where a name is known and left as the raw id
 * where it is not, because an id with no name still holds a real share.
 */
export function authorshipStats(
  audits: IAudit[],
  userNames: Record<string, string> = {}
): AuthorshipRow[] {
  const creates = new Map<string, number>();
  const edits = new Map<string, number>();

  for (const audit of audits) {
    const bucket = audit.type === EventType.CREATE ? creates : edits;
    bucket.set(audit.user, (bucket.get(audit.user) ?? 0) + 1);
  }

  const totalCreates = [...creates.values()].reduce((a, b) => a + b, 0);
  const totalEdits = [...edits.values()].reduce((a, b) => a + b, 0);

  return [...new Set([...creates.keys(), ...edits.keys()])]
    .map((user) => {
      const c = creates.get(user) ?? 0;
      const e = edits.get(user) ?? 0;
      return {
        user,
        label: userNames[user] ?? "unnamed user",
        creates: c,
        createsShare: percent(c, totalCreates),
        edits: e,
        editsShare: percent(e, totalEdits),
        total: c + e,
        totalShare: percent(c + e, audits.length),
      };
    })
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

/**
 * Every id the dataset points at from the inside, checked against the ids it
 * contains. A dataset that fails this is not importable on its own, whatever
 * its counts look like.
 */
export function findDanglingRefs(
  entities: IEntity[],
  relations: RelationTypes.IRelation[]
): DanglingRef[] {
  const present = new Set(entities.map((e) => e.id));
  const byId = new Map(entities.map((e) => [e.id, e]));
  const out: DanglingRef[] = [];

  const carrier = (id: string) => {
    const entity = byId.get(id);
    return {
      carrierId: id,
      carrierClass: entity?.class ?? "?",
      carrierLabel: firstLabel(entity),
    };
  };

  for (const entity of entities) {
    for (const reference of entity.references ?? []) {
      if (reference.value && !present.has(reference.value)) {
        out.push({
          kind: "reference value",
          ...carrier(entity.id),
          missingId: reference.value,
        });
      }
      if (reference.resource && !present.has(reference.resource)) {
        out.push({
          kind: "reference resource",
          ...carrier(entity.id),
          missingId: reference.resource,
        });
      }
    }

    for (const prop of walkProps(entity.props)) {
      for (const [kind, id] of [
        ["metaprop type", prop.type.entityId],
        ["metaprop value", prop.value.entityId],
      ] as [string, string][]) {
        if (id && !present.has(id)) {
          out.push({ kind, ...carrier(entity.id), missingId: id });
        }
      }
    }
  }

  for (const relation of relations) {
    for (const entityId of relation.entityIds) {
      if (entityId && !present.has(entityId)) {
        out.push({
          kind: `relation ${relation.type}`,
          carrierId: relation.id,
          carrierClass: "relation",
          carrierLabel: relation.type,
          missingId: entityId,
        });
      }
    }
  }

  return out;
}

export function collectStats(input: {
  entities: IEntity[];
  relations: RelationTypes.IRelation[];
  audits: IAudit[];
  userNames?: Record<string, string>;
  droppedProps?: DroppedProp[];
}): DatasetStats {
  const { entities, relations, audits } = input;
  const droppedProps = input.droppedProps ?? [];

  const distinctEntityIds = new Set(entities.map((e) => e.id)).size;
  const dangling = findDanglingRefs(entities, relations);
  const audited = new Set(audits.map((a) => a.modelId));

  const problems: string[] = [];
  if (entities.length && !relations.length) {
    problems.push("no relations were exported alongside a non-empty entity set");
  }
  if (distinctEntityIds !== entities.length) {
    problems.push(
      `${entities.length - distinctEntityIds} entity rows repeat an id already in the dataset`
    );
  }
  if (dangling.length) {
    const byKind = countBy(dangling, (d) => d.kind);
    problems.push(
      `${dangling.length} references point at ids the dataset does not contain (${byKind
        .map((r) => `${r.count} ${r.key}`)
        .join(", ")})`
    );
  }

  return {
    entityCount: entities.length,
    distinctEntityIds,
    entityClasses: entityClassStats(entities),
    relationCount: relations.length,
    relationTypes: relationTypeStats(relations),
    auditCount: audits.length,
    authorship: authorshipStats(audits, input.userNames),
    auditedEntities: entities.filter((e) => audited.has(e.id)).length,
    unauditedEntities: entities.filter((e) => !audited.has(e.id)).length,
    dangling,
    droppedProps,
    problems,
  };
}

const num = (n: number) => n.toLocaleString("en-US");
const pct = (n: number) => `${n.toFixed(2)}%`;

const mdTable = (headers: string[], rows: string[][]): string =>
  [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map((_, i) => (i ? "--:" : "---")).join(" | ")} |`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");

/** The dataset's own README: what it holds, who wrote it, what is wrong with it. */
export function renderMarkdown(
  stats: DatasetStats,
  meta: { name: string; source?: string; generatedAt?: Date }
): string {
  const generated = (meta.generatedAt ?? new Date()).toISOString();
  const out: string[] = [
    `# ${meta.name}`,
    "",
    `Generated ${generated}${meta.source ? ` from \`${meta.source}\`` : ""}.`,
    "",
    `- entities: **${num(stats.entityCount)}** (${num(stats.distinctEntityIds)} distinct ids)`,
    `- relations: **${num(stats.relationCount)}**`,
    `- audits: **${num(stats.auditCount)}**`,
    `- entities carrying at least one audit: ${num(stats.auditedEntities)}; without any: ${num(stats.unauditedEntities)}`,
    "",
    "## Entity classes",
    "",
    mdTable(
      ["class", "name", "count", "share"],
      stats.entityClasses.map((r) => [
        `\`${r.key}\``,
        r.label,
        num(r.count),
        pct(r.share),
      ])
    ),
    "",
    "## Relation types",
    "",
    mdTable(
      ["type", "count", "share"],
      stats.relationTypes.map((r) => [`\`${r.key}\``, num(r.count), pct(r.share)])
    ),
    "",
    "## Authorship",
    "",
    "Shares are of all creations, of all edits, and of all audit records in this dataset. Roles are not assigned here.",
    "",
    mdTable(
      ["user", "id", "creations", "of creations", "edits", "of edits", "all", "of all"],
      stats.authorship.map((r) => [
        r.label,
        `\`${r.user}\``,
        num(r.creates),
        pct(r.createsShare),
        num(r.edits),
        pct(r.editsShare),
        num(r.total),
        pct(r.totalShare),
      ])
    ),
    "",
  ];

  if (stats.droppedProps.length) {
    const groups: [EndpointState, string, string][] = [
      [
        "absent",
        "Endpoint no longer exists in the source database",
        "An id is set but no such entity is in the database. This is data loss and worth chasing in the app.",
      ],
      [
        "unfinished",
        "Endpoint left empty",
        "The prop carries no id on one side, so it was never finished in the editor. Nothing is lost by dropping it.",
      ],
      [
        "outOfScope",
        "Endpoint of a class this dataset does not cover",
        "The scope working as designed: the prop points at an entity of a class outside the dataset, so neither can be carried.",
      ],
    ];

    const counted = groups.map(
      ([state, title, note]) =>
        [
          state,
          title,
          note,
          stats.droppedProps.filter((p) => droppedPropGroup(p) === state),
        ] as const
    );

    out.push(
      "## Warning: metaprops not carried into this dataset",
      "",
      `${num(stats.droppedProps.length)} metaprops on exported entities were dropped, because a prop can only be carried when both of its endpoints are in the dataset: ${counted
        .filter(([, , , props]) => props.length)
        .map(([state, , , props]) => `${num(props.length)} ${state}`)
        .join(", ")}. Each row names the entity carrying the prop, so it can be opened in the app by id or label.`,
      ""
    );

    for (const [, title, note, props] of counted) {
      if (!props.length) {
        continue;
      }
      out.push(
        `### ${title}`,
        "",
        note,
        "",
        mdTable(
          ["carrier", "carrier id", "prop type", "prop value"],
          props.map((p) => [
            `${p.carrierClass} ${p.carrierLabel}`,
            `\`${p.carrierId}\``,
            `${p.typeLabel || "—"} ${p.typeId ? `\`${p.typeId}\`` : ""} (${p.typeState})`,
            `${p.valueLabel || "—"} ${p.valueId ? `\`${p.valueId}\`` : ""} (${p.valueState})`,
          ])
        ),
        ""
      );
    }
  }

  if (stats.dangling.length) {
    out.push(
      "## Broken references",
      "",
      "These point at ids the dataset does not contain, so it cannot be imported on its own.",
      "",
      mdTable(
        ["kind", "carrier", "carrier id", "missing id"],
        stats.dangling
          .slice(0, 200)
          .map((d) => [
            d.kind,
            `${d.carrierClass} ${d.carrierLabel}`,
            `\`${d.carrierId}\``,
            `\`${d.missingId}\``,
          ])
      ),
      ""
    );
    if (stats.dangling.length > 200) {
      out.push(`… and ${num(stats.dangling.length - 200)} more.`, "");
    }
  }

  return out.join("\n");
}

/** A short version for the terminal: the shape of the data, then anything wrong. */
export function renderConsole(stats: DatasetStats): string {
  const pad = (s: string, n: number) => s.padEnd(n);
  const lines: string[] = [
    `entities  ${num(stats.entityCount)} (${num(stats.distinctEntityIds)} distinct ids)`,
  ];

  for (const r of stats.entityClasses) {
    lines.push(`  ${pad(r.key, 4)} ${pad(num(r.count), 8)} ${pct(r.share)}`);
  }
  lines.push(`relations ${num(stats.relationCount)}`);
  for (const r of stats.relationTypes) {
    lines.push(`  ${pad(r.key, 4)} ${pad(num(r.count), 8)} ${pct(r.share)}`);
  }
  lines.push(`audits    ${num(stats.auditCount)}`);
  for (const r of stats.authorship) {
    lines.push(
      `  ${pad(r.label, 26)} ${pad(num(r.total), 8)} ${pad(pct(r.totalShare), 8)} (${num(r.creates)} created, ${num(r.edits)} edited)`
    );
  }

  if (stats.droppedProps.length) {
    const byGroup = countBy(stats.droppedProps, droppedPropGroup);
    lines.push(
      `WARNING: ${num(stats.droppedProps.length)} metaprops dropped (${byGroup
        .map((r) => `${num(r.count)} ${r.key}`)
        .join(", ")}) - listed with their carriers in summary.md`
    );
  }
  for (const problem of stats.problems) {
    lines.push(`PROBLEM: ${problem}`);
  }

  return lines.join("\n");
}

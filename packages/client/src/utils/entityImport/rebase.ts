import { IEntity, IProp, IReference, Relation } from "@inkvisitor/shared/types";
import {
  AppendConflict,
  AppendSkips,
  conflictOf,
  labelsDiffer,
  SameEntity,
  sameEntityBy,
  SKIPPED_DATA_KEYS,
} from "./appendMerge";
import { ImportDraft } from "./draft";
import { isPlainObject, quote, sameJson, unique } from "./helpers";

/**
 * Moving an appended draft onto its stored entity as the database holds it
 * now. Three versions meet: `base`, the stored entity the draft was merged
 * with; `ours`, the draft with what the import adds and the edits made in
 * Detail; `theirs`, the stored entity now. What only one side changed is
 * taken from that side; a value both changed differently becomes a conflict.
 */
interface Rebase {
  // the conflicts the draft already had, settled or not
  previous: AppendConflict[];
  conflicts: AppendConflict[];
  notes: string[];
  // what the draft adds that the database gained meanwhile, so it is skipped
  skipped: Pick<AppendSkips, "labels" | "notes" | "props" | "references">;
}

/**
 * A value both sides set. A conflict of the draft keeps its choice, with the
 * value stored now as its stored side; a new conflict keeps the draft's value
 * until the user picks the stored one.
 */
const resolve = (
  path: string,
  base: unknown,
  ours: unknown,
  theirs: unknown,
  rebase: Rebase
): unknown => {
  const settled = rebase.previous.find((conflict) => conflict.path === path);
  if (settled && (sameJson(ours, settled.storedValue) || sameJson(ours, settled.importedValue))) {
    if (sameJson(theirs, settled.importedValue)) {
      return theirs;
    }
    rebase.conflicts.push({
      ...conflictOf(path, theirs, settled.importedValue),
      useImported: settled.useImported,
    });
    return settled.useImported ? settled.importedValue : theirs;
  }
  if (sameJson(ours, base)) {
    return theirs;
  }
  if (sameJson(theirs, base) || sameJson(ours, theirs)) {
    return ours;
  }
  rebase.conflicts.push({ ...conflictOf(path, theirs, ours), useImported: true });
  return ours;
};

/** The stored items now, without those the draft removed, plus those it added. */
const mergeList = <T>(base: T[], ours: T[], theirs: T[]): T[] => {
  const has = (list: T[], item: T) => list.some((candidate) => sameJson(candidate, item));
  return [
    ...theirs.filter((item) => has(ours, item) || !has(base, item)),
    ...ours.filter((item) => !has(base, item) && !has(theirs, item)),
  ];
};

const rebaseLabels = (base: string[], ours: string[], theirs: string[], rebase: Rebase) => {
  const main = resolve("labels[0]", base[0], ours[0], theirs[0], rebase) as string;
  return [main, ...mergeList(base, ours, theirs).filter((label) => label !== main)];
};

const rebaseData = (
  base: Record<string, unknown>,
  ours: Record<string, unknown>,
  theirs: Record<string, unknown>,
  path: string,
  rebase: Rebase
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const key of unique([...Object.keys(theirs), ...Object.keys(ours), ...Object.keys(base)])) {
    const keyPath = `${path}.${key}`;
    const [before, own, stored] = [base[key], ours[key], theirs[key]];
    // a key the draft has a conflict on keeps it whole, whichever side the
    // conflict is set to, so its value is not merged into
    const hadConflict = rebase.previous.some((conflict) => conflict.path === keyPath);
    // an append never writes these, so they stay as stored
    const value =
      path === "data" && SKIPPED_DATA_KEYS.includes(key)
        ? stored
        : hadConflict
          ? resolve(keyPath, before, own, stored, rebase)
          : isPlainObject(own) && isPlainObject(stored)
          ? rebaseData(isPlainObject(before) ? before : {}, own, stored, keyPath, rebase)
          : Array.isArray(own) && Array.isArray(stored)
            ? mergeList(Array.isArray(before) ? before : [], own, stored)
            : resolve(keyPath, before, own, stored, rebase);
    if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
};

/**
 * Metaprops or references by id. One changed on both sides, or changed on
 * one side and removed on the other, stays as stored now, with a note; the
 * draft's change is shown in it, so the user can make it again.
 */
const rebaseById = <T extends { id: string }>(
  base: T[],
  ours: T[],
  theirs: T[],
  rebase: Rebase,
  describe: (item: T) => string,
  // the fields compared, without nested items
  fieldsOf: (item: T) => object = (item) => item,
  // merges the nested items into the merged item; no `before` for an item
  // both sides added
  nest: (merged: T, before: T | undefined, own: T, stored: T) => T = (merged) => merged,
  // whether two items are the same metaprop or reference, whatever their ids
  isSame: (stored: T, own: T) => boolean = () => false,
  // counts a draft item merged into the same one the database added
  onSkip: () => void = () => {}
): T[] => {
  const byId = (items: T[]) => new Map(items.map((item) => [item.id, item]));
  const [baseById, oursById, theirsById] = [byId(base), byId(ours), byId(theirs)];
  const out: T[] = [];
  for (const stored of theirs) {
    const before = baseById.get(stored.id);
    const own = oursById.get(stored.id);
    // added in the database
    if (!before) {
      out.push(stored);
      continue;
    }
    if (!own) {
      if (!sameJson(stored, before)) {
        rebase.notes.push(
          `${describe(stored)}: removed here but changed in the database, so it stays`
        );
        out.push(stored);
      }
      continue;
    }
    let merged = stored;
    if (sameJson(fieldsOf(stored), fieldsOf(before))) {
      merged = { ...stored, ...fieldsOf(own) };
    } else if (
      !sameJson(fieldsOf(own), fieldsOf(before)) &&
      !sameJson(fieldsOf(own), fieldsOf(stored))
    ) {
      rebase.notes.push(
        `${describe(own)}: changed here and in the database; it keeps the database version`
      );
    }
    out.push(nest(merged, before, own, stored));
  }
  for (const own of ours) {
    const before = baseById.get(own.id);
    if (!before && !theirsById.has(own.id)) {
      // the database gained the same item meanwhile, which the draft's merges into
      const twinIndex = out.findIndex(
        (item) => !baseById.has(item.id) && theirsById.has(item.id) && isSame(item, own)
      );
      if (twinIndex === -1) {
        out.push(own);
      } else {
        out[twinIndex] = nest(out[twinIndex], undefined, own, out[twinIndex]);
        onSkip();
      }
    } else if (before && !theirsById.has(own.id) && !sameJson(own, before)) {
      rebase.notes.push(`${describe(own)}: changed here but removed in the database, so it goes`);
    }
  }
  return out;
};

const rebaseProps = (
  base: IProp[],
  ours: IProp[],
  theirs: IProp[],
  rebase: Rebase,
  labelOf: (entityId: string) => string,
  same: SameEntity
): IProp[] =>
  rebaseById(
    base,
    ours,
    theirs,
    rebase,
    (prop) => `metaprop ${quote(labelOf(prop.type.entityId))}`,
    ({ children: _children, ...fields }) => fields,
    (merged, before, own, stored) => ({
      ...merged,
      children: rebaseProps(
        before?.children ?? [],
        own.children,
        stored.children,
        rebase,
        labelOf,
        same
      ),
    }),
    (stored, own) =>
      same(stored.type.entityId, own.type.entityId) &&
      same(stored.value.entityId, own.value.entityId),
    () => rebase.skipped.props++
  );

/**
 * The appended draft on top of the stored entity as it is now, with its
 * conflicts and notes on what could not be kept.
 */
export const rebaseEntity = (
  base: IEntity,
  ours: IEntity,
  theirs: IEntity,
  previous: AppendConflict[],
  labelOf: (entityId: string) => string,
  // a Value copy of the draft and a stored Value with its text are the same
  same: SameEntity = (storedId, importedId) => storedId === importedId
): {
  entity: IEntity;
  conflicts: AppendConflict[];
  notes: string[];
  skipped: Rebase["skipped"];
} => {
  const rebase: Rebase = {
    previous,
    conflicts: [],
    notes: [],
    skipped: { labels: 0, notes: 0, props: 0, references: 0 },
  };
  // a label or note both sides added is in the database now
  const bothAdded = (before: string[], own: string[], stored: string[]) =>
    own.filter((item) => !before.includes(item) && stored.includes(item)).length;
  rebase.skipped.labels = bothAdded(base.labels, ours.labels, theirs.labels);
  rebase.skipped.notes = bothAdded(base.notes, ours.notes, theirs.notes);
  const entity: IEntity = { ...theirs };
  entity.labels = rebaseLabels(base.labels, ours.labels, theirs.labels, rebase);
  entity.notes = mergeList(base.notes, ours.notes, theirs.notes);
  for (const field of ["detail", "language", "status", "legacyId"] as const) {
    (entity as unknown as Record<string, unknown>)[field] = resolve(
      field,
      base[field],
      ours[field],
      theirs[field],
      rebase
    );
  }
  entity.data = rebaseData(base.data ?? {}, ours.data ?? {}, theirs.data ?? {}, "data", rebase);
  entity.props = rebaseProps(base.props, ours.props, theirs.props, rebase, labelOf, same);
  entity.references = rebaseById<IReference>(
    base.references,
    ours.references,
    theirs.references,
    rebase,
    (reference) => `reference ${quote(labelOf(reference.resource))}`,
    undefined,
    undefined,
    (stored, own) => stored.resource === own.resource && stored.value === own.value,
    () => rebase.skipped.references++
  );
  return { entity, conflicts: rebase.conflicts, notes: rebase.notes, skipped: rebase.skipped };
};

/**
 * The stored relations of the appended draft as the database holds them now.
 * A relation edited or unlinked here keeps that edit when the database still
 * holds it as loaded; one changed on both sides keeps the database version of
 * each field both changed; one removed in the database goes, edit and all.
 * The relations added in the database since join the stored ones.
 */
export const rebaseStoredRelations = (
  draft: ImportDraft,
  entityId: string,
  current: Relation.IRelation[],
  labelOf: (entityId: string) => string
): { draft: ImportDraft; notes: string[] } => {
  const describe = (relation: Relation.IRelation) =>
    `stored relation ${Relation.RelationRules[relation.type]!.label} ${relation.entityIds
      .map((id) => quote(labelOf(id)))
      .join(", ")}`;
  const stored = draft.storedRelations ?? [];
  const nowById = new Map(current.map((relation) => [relation.id, relation]));
  const draftById = new Map(draft.relations.map((relation) => [relation.id, relation]));
  const notes: string[] = [];
  let relations = draft.relations;
  let storedRelations = stored;
  const replace = (list: Relation.IRelation[], relation: Relation.IRelation) =>
    list.map((candidate) => (candidate.id === relation.id ? relation : candidate));

  for (const before of stored.filter((relation) => relation.entityIds.includes(entityId))) {
    const now = nowById.get(before.id);
    const own = draftById.get(before.id);
    if (!now) {
      if (own && !sameJson(own, before)) {
        notes.push(`${describe(own)}: changed here but removed in the database, so it goes`);
      }
      relations = relations.filter((relation) => relation.id !== before.id);
      storedRelations = storedRelations.filter((relation) => relation.id !== before.id);
      continue;
    }
    if (sameJson(now, before)) {
      continue;
    }
    storedRelations = replace(storedRelations, now);
    if (!own) {
      notes.push(`${describe(now)}: unlinked here and changed in the database; it stays unlinked`);
      continue;
    }
    const fields = unique([...Object.keys(now), ...Object.keys(own), ...Object.keys(before)]);
    const ownFields = own as unknown as Record<string, unknown>;
    const beforeFields = before as unknown as Record<string, unknown>;
    const nowFields = now as unknown as Record<string, unknown>;
    // a field takes the draft's edit only where the database kept it as loaded
    const merged = Object.fromEntries(
      fields
        .map((field) => [
          field,
          sameJson(nowFields[field], beforeFields[field]) ? ownFields[field] : nowFields[field],
        ])
        .filter(([, value]) => value !== undefined)
    ) as unknown as Relation.IRelation;
    const bothChanged = fields.some(
      (field) =>
        !sameJson(ownFields[field], beforeFields[field]) &&
        !sameJson(nowFields[field], beforeFields[field]) &&
        !sameJson(ownFields[field], nowFields[field])
    );
    if (bothChanged) {
      notes.push(
        `${describe(own)}: changed here and in the database; where both changed it, it keeps the database version`
      );
    }
    relations = replace(relations, merged);
  }

  const known = new Set([...stored, ...draft.relations].map((relation) => relation.id));
  const added = current.filter((relation) => !known.has(relation.id));
  return {
    draft: {
      ...draft,
      relations: [...relations, ...added],
      storedRelations: [...storedRelations, ...added],
    },
    notes,
  };
};

/**
 * Moves an appended draft onto its stored entity and stored relations as the
 * database holds them now, so the import can write it again; see rebaseEntity
 * and rebaseStoredRelations. The notes name what the draft could not keep.
 */
export const rebaseAppend = (
  draft: ImportDraft,
  entityId: string,
  current: IEntity,
  currentRelations: Relation.IRelation[],
  labelOf: (entityId: string) => string
): { draft: ImportDraft; notes: string[] } => {
  const append = draft.appends?.[entityId];
  const ours = draft.entities.find((entity) => entity.id === entityId);
  if (!append || !ours) {
    return { draft, notes: [] };
  }
  const { entity, conflicts, notes, skipped } = rebaseEntity(
    append.stored,
    ours,
    current,
    append.conflicts,
    labelOf,
    sameEntityBy(
      (id) => draft.entities.find((candidate) => candidate.id === id) ?? draft.existing[id]
    )
  );
  const rebased: ImportDraft = {
    ...draft,
    entities: draft.entities.map((candidate) => (candidate.id === entityId ? entity : candidate)),
    appends: {
      ...draft.appends,
      [entityId]: {
        ...append,
        stored: current,
        conflicts,
        skipped: {
          ...append.skipped,
          labels: append.skipped.labels + skipped.labels,
          notes: append.skipped.notes + skipped.notes,
          props: append.skipped.props + skipped.props,
          references: append.skipped.references + skipped.references,
        },
        // the input's labels are those the draft holds beyond the stored ones
        // it was merged with; a mismatch ends when the database gains one
        labelMismatch:
          append.labelMismatch &&
          labelsDiffer(
            current.labels,
            ours.labels.filter((label) => !append.stored.labels.includes(label))
          ),
      },
    },
  };
  const relations = rebaseStoredRelations(rebased, entityId, currentRelations, labelOf);
  return { draft: relations.draft, notes: [...notes, ...relations.notes] };
};

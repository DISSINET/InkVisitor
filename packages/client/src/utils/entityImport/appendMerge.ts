import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp, IReference } from "@inkvisitor/shared/types";
import { isDuplicateLabel } from "utils/entityLabels";
import { count, isPlainObject, setAtPath } from "./helpers";

/**
 * A field that holds one value, set differently in the database and in the
 * import. The draft holds the stored value until the user picks the imported
 * one.
 */
export interface AppendConflict {
  // "detail", "language", "legacyId", "labels[0]" or a data path like "data.pos"
  path: string;
  label: string;
  // the two values as shown
  stored: string;
  imported: string;
  // the two values as held, written back with their own type
  storedValue: unknown;
  importedValue: unknown;
  useImported: boolean;
}

/** What the import holds that the stored entity already has. */
export interface AppendSkips {
  labels: number;
  notes: number;
  fields: number;
  props: number;
  references: number;
  relations: number;
  // Values of the input left uncreated, as only skipped metaprops or
  // references used them
  values: number;
}

/** An input entity whose id is taken: it is appended to the stored entity. */
export interface AppendInfo {
  // the entity as the database held it when the import was validated
  stored: IEntity;
  conflicts: AppendConflict[];
  skipped: AppendSkips;
}

export const emptySkips = (): AppendSkips => ({
  labels: 0,
  notes: 0,
  fields: 0,
  props: 0,
  references: 0,
  relations: 0,
  values: 0,
});

// Detail lets the user edit these; a territory keeps its place in the tree
// and a resource its document
const SCALAR_FIELDS = ["detail", "language", "status", "legacyId"] as const;

/**
 * The fields the input set itself. A field it leaves out is filled with a
 * default, the user's language or the pending status, which must not compete
 * with the stored value.
 */
export interface GivenFields {
  language?: boolean;
  status?: boolean;
}
const SKIPPED_DATA_KEYS = ["parent", "validations", "documentId"];

const FIELD_LABELS: Record<string, string> = {
  "labels[0]": "main label",
  language: "label language",
  status: "status",
  legacyId: "legacy id",
  "data.pos": "part of speech",
  "data.logicalType": "logical type",
  "data.url": "URL",
  "data.partValueLabel": "part value label",
  "data.partValueBaseURL": "part value base URL",
};

const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);

/**
 * Whether two entity ids name the same thing. A Value only holds its text, so
 * two Values with the same label count as the same, whatever their ids.
 */
export type SameEntity = (storedId: string, importedId: string) => boolean;

export const sameEntityBy =
  (entityOf: (entityId: string) => IEntity | undefined): SameEntity =>
  (storedId, importedId) => {
    if (storedId === importedId) {
      return true;
    }
    const stored = entityOf(storedId);
    const imported = entityOf(importedId);
    return (
      stored?.class === EntityEnums.Class.Value &&
      imported?.class === EntityEnums.Class.Value &&
      stored.labels[0] === imported.labels[0]
    );
  };

const sameProp = (stored: IProp, imported: IProp, same: SameEntity) =>
  same(stored.type.entityId, imported.type.entityId) &&
  same(stored.value.entityId, imported.value.entityId);

/**
 * The stored metaprops plus the imported ones they lack. An imported metaprop
 * with the type and value of a stored one is that metaprop: it is skipped and
 * its children are merged into the stored children, so a subproperty can be
 * added to a stored property.
 */
const mergeProps = (
  stored: IProp[],
  imported: IProp[],
  same: SameEntity,
  skips: AppendSkips
): IProp[] => {
  const merged = [...stored];
  for (const prop of imported) {
    const matchIndex = merged.findIndex((candidate) => sameProp(candidate, prop, same));
    if (matchIndex === -1) {
      merged.push(prop);
      continue;
    }
    skips.props++;
    const match = merged[matchIndex];
    merged[matchIndex] = {
      ...match,
      children: mergeProps(match.children, prop.children, same, skips),
    };
  }
  return merged;
};

const mergeReferences = (
  stored: IReference[],
  imported: IReference[],
  same: SameEntity,
  skips: AppendSkips
): IReference[] => {
  const merged = [...stored];
  for (const reference of imported) {
    if (
      merged.some(
        (candidate) =>
          same(candidate.resource, reference.resource) && same(candidate.value, reference.value)
      )
    ) {
      skips.references++;
    } else {
      merged.push(reference);
    }
  }
  return merged;
};

const display = (value: unknown) => (typeof value === "string" ? value : JSON.stringify(value));

const conflictOf = (path: string, stored: unknown, imported: unknown): AppendConflict => ({
  path,
  label: FIELD_LABELS[path] ?? path,
  stored: display(stored),
  imported: display(imported),
  storedValue: stored,
  importedValue: imported,
  useImported: false,
});

const shapeOf = (value: unknown) =>
  Array.isArray(value) ? "list" : isPlainObject(value) ? "object" : "value";

/**
 * One value against the stored one: an empty stored value is filled, an equal
 * one skipped, a different one a conflict. Returns the value to keep.
 */
const mergeScalar = (
  current: unknown,
  value: unknown,
  path: string,
  skips: AppendSkips,
  conflicts: AppendConflict[]
): unknown => {
  if (isEmpty(current)) {
    return value;
  }
  if (current === value) {
    skips.fields++;
  } else {
    conflicts.push(conflictOf(path, current, value));
  }
  return current;
};

/**
 * Walks the imported data next to the stored data: an empty imported value
 * adds nothing, a list gets the items it lacks, an empty stored value is
 * filled, and two different values are a conflict.
 */
const mergeData = (
  stored: Record<string, unknown>,
  imported: Record<string, unknown>,
  path: string,
  skips: AppendSkips,
  conflicts: AppendConflict[]
): Record<string, unknown> => {
  const merged = { ...stored };
  for (const [key, value] of Object.entries(imported)) {
    const keyPath = `${path}.${key}`;
    if ((path === "data" && SKIPPED_DATA_KEYS.includes(key)) || isEmpty(value)) {
      continue;
    }
    const current = stored[key];
    // a stored value of another shape is never merged into, only chosen over
    if (!isEmpty(current) && shapeOf(current) !== shapeOf(value)) {
      conflicts.push(conflictOf(keyPath, current, value));
      continue;
    }
    if (isPlainObject(value)) {
      merged[key] = mergeData(
        isPlainObject(current) ? current : {},
        value,
        keyPath,
        skips,
        conflicts
      );
    } else if (Array.isArray(value)) {
      const list = Array.isArray(current) ? current : [];
      const missing = value.filter((item) => !list.includes(item));
      if (missing.length) {
        merged[key] = [...list, ...missing];
      } else {
        skips.fields++;
      }
    } else {
      merged[key] = mergeScalar(current, value, keyPath, skips, conflicts);
    }
  }
  return merged;
};

/**
 * The stored entity with what the import adds to it. Duplicates are skipped
 * and counted; a field holding one value that both set differently becomes a
 * conflict, resolved to the stored value until the user picks the other.
 *
 * @param given the fields with a default that the input set itself
 */
export const mergeIntoStored = (
  stored: IEntity,
  imported: IEntity,
  same: SameEntity,
  given: GivenFields
): { entity: IEntity; conflicts: AppendConflict[]; skipped: AppendSkips } => {
  const skipped = emptySkips();
  const conflicts: AppendConflict[] = [];
  const entity: IEntity = { ...stored };

  const labels = [...stored.labels];
  imported.labels.forEach((label, labelIndex) => {
    if (isDuplicateLabel(labels, label)) {
      skipped.labels++;
      return;
    }
    labels.push(label);
    if (labelIndex === 0) {
      conflicts.push(conflictOf("labels[0]", stored.labels[0], label));
    }
  });
  entity.labels = labels;

  const notes = [...stored.notes];
  imported.notes.forEach((note) => {
    if (notes.some((candidate) => candidate.trim() === note.trim())) {
      skipped.notes++;
    } else {
      notes.push(note);
    }
  });
  entity.notes = notes;

  for (const field of SCALAR_FIELDS) {
    const value = imported[field];
    if (isEmpty(value) || ((field === "language" || field === "status") && !given[field])) {
      continue;
    }
    (entity as unknown as Record<string, unknown>)[field] = mergeScalar(
      stored[field],
      value,
      field,
      skipped,
      conflicts
    );
  }

  entity.data = mergeData(stored.data ?? {}, imported.data ?? {}, "data", skipped, conflicts);
  entity.props = mergeProps(stored.props, imported.props, same, skipped);
  entity.references = mergeReferences(stored.references, imported.references, same, skipped);

  return { entity, conflicts, skipped };
};

/**
 * The entity with one conflict settled. Both main labels stay: the one not
 * picked becomes an alternative label.
 */
export const applyConflictChoice = (
  entity: IEntity,
  conflict: AppendConflict,
  useImported: boolean
): IEntity => {
  const value = useImported ? conflict.imported : conflict.stored;
  if (conflict.path === "labels[0]") {
    const other = useImported ? conflict.stored : conflict.imported;
    const rest = entity.labels.filter((label) => label !== value && label !== other);
    return { ...entity, labels: [value, ...rest, other] };
  }
  // conflicts sit on top-level fields or in data, so copying data keeps the
  // entity given unchanged
  const out = { ...entity, data: structuredClone(entity.data) };
  setAtPath(
    out,
    conflict.path,
    structuredClone(useImported ? conflict.importedValue : conflict.storedValue)
  );
  return out;
};

/**
 * Gives the metaprops and references that match stored ones the stored ids
 * back, as the import generates ids for nested objects anew.
 */
export const keepStoredIds = (stored: IEntity, entity: IEntity): IEntity => {
  const sameId: SameEntity = (storedId, importedId) => storedId === importedId;
  const keepPropIds = (storedProps: IProp[], props: IProp[]): IProp[] => {
    const unused = [...storedProps];
    return props.map((prop) => {
      const matchIndex = unused.findIndex((candidate) => sameProp(candidate, prop, sameId));
      if (matchIndex === -1) {
        return prop;
      }
      const [match] = unused.splice(matchIndex, 1);
      return { ...prop, id: match.id, children: keepPropIds(match.children, prop.children) };
    });
  };
  const unusedReferences = [...stored.references];
  const references = entity.references.map((reference) => {
    const matchIndex = unusedReferences.findIndex(
      (candidate) =>
        candidate.resource === reference.resource && candidate.value === reference.value
    );
    if (matchIndex === -1) {
      return reference;
    }
    const [match] = unusedReferences.splice(matchIndex, 1);
    return { ...reference, id: match.id };
  });
  return { ...entity, props: keepPropIds(stored.props, entity.props), references };
};

/** Whether the stored entity was saved again since `known` was read. */
export const isStale = (known: IEntity, current: IEntity) =>
  String(known.updatedAt) !== String(current.updatedAt);

// the fields an append may change
const APPEND_FIELDS = [
  "labels",
  "detail",
  "language",
  "status",
  "notes",
  "legacyId",
  "data",
  "props",
  "references",
] as const;

// The server merges an update's data into the stored data, so leaving a key
// out keeps the stored value. A territory update carrying `parent` reorders it
// among its siblings even when the order is unchanged.
const withoutSkippedData = (data: object | undefined) =>
  Object.fromEntries(
    Object.entries(data ?? {}).filter(([key]) => !SKIPPED_DATA_KEYS.includes(key))
  );

/** The fields of the appended entity that differ from the stored entity. */
export const appendChanges = (stored: IEntity, entity: IEntity): Partial<IEntity> => {
  const changes: Partial<IEntity> = {};
  for (const field of APPEND_FIELDS) {
    const [storedValue, value] =
      field === "data"
        ? [withoutSkippedData(stored.data), withoutSkippedData(entity.data)]
        : [stored[field], entity[field]];
    if (JSON.stringify(storedValue) !== JSON.stringify(value)) {
      (changes as Record<string, unknown>)[field] = value;
    }
  }
  return changes;
};

// The server merges an update's data into the stored data, so a key the
// append filled is set back to null rather than left out.
const revertData = (
  stored: Record<string, unknown>,
  appended: Record<string, unknown>
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(appended).map(([key, value]) => [
      key,
      isPlainObject(value)
        ? revertData(isPlainObject(stored[key]) ? stored[key] : {}, value)
        : stored[key] ?? null,
    ])
  );

/** The stored values of the changed fields, to undo an append. */
export const storedFields = (stored: IEntity, changes: Partial<IEntity>): Partial<IEntity> =>
  Object.fromEntries(
    Object.keys(changes).map((field) => [
      field,
      field === "data"
        ? revertData(stored.data ?? {}, changes.data ?? {})
        : stored[field as keyof IEntity] ?? "",
    ])
  ) as Partial<IEntity>;

const SKIP_NAMES: [keyof AppendSkips, string, string][] = [
  ["labels", "label", "labels"],
  ["notes", "note", "notes"],
  ["fields", "field", "fields"],
  ["props", "metaprop", "metaprops"],
  ["references", "reference", "references"],
  ["relations", "relation", "relations"],
  ["values", "Value", "Values"],
];

/** "2 metaprops, 1 reference", or "" when nothing was skipped */
export const describeSkips = (skips: AppendSkips): string =>
  SKIP_NAMES.filter(([key]) => skips[key] > 0)
    .map(([key, singular, plural]) => count(skips[key], singular, plural))
    .join(", ");

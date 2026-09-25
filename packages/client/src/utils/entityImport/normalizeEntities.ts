import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp, IPropSpec, IReference } from "@inkvisitor/shared/types";
import { IActionEntity } from "@inkvisitor/shared/types/action";
import { ITerritoryProtocol } from "@inkvisitor/shared/types/territory";
import { CEmptyProtocol, CMetaProp, CReference } from "constructors";
import { v4 as uuidv4 } from "uuid";
import {
  enumList,
  isEnumValue,
  isNonEmptyString,
  isPlainObject,
  isStringList,
  quote,
} from "./helpers";
import { ImportEntity, ImportIssue, RawRelation } from "./types";

// Metaprops nest in three levels: prop, its children, their children.
const MAX_PROP_DEPTH = 3;

const ENTITY_KEYS = [
  "id",
  "class",
  "status",
  "data",
  "labels",
  "detail",
  "language",
  "notes",
  "props",
  "references",
  "relations",
];
const SERVER_MANAGED_KEYS = ["createdAt", "updatedAt"];
// What the JSON section of Detail shows on top of the entity itself; an
// entity copied from there is accepted as it is, these fields are dropped.
const DETAIL_VIEW_KEYS = [
  "entities",
  "usedInStatements",
  "usedInStatementProps",
  "usedInMetaProps",
  "usedInDocuments",
  "usedInStatementIdentifications",
  "usedInStatementClassifications",
  "usedInReferences",
  "usedInReferenceParts",
  "usedAsTemplate",
  "warnings",
  "legacyValidations",
  "right",
  "isEquivalent",
  "isSubordinate",
  "anchorTexts",
];
const RELATION_GROUP_KEYS = ["connections", "iConnections"];
// Rejected when they carry a value; empty ones (isTemplate: false, as in a
// database dump) are dropped with a note.
const TEMPLATE_KEYS: Record<string, string> = {
  isTemplate: "templates can't be imported",
  usedTemplate: "entities created from a template can't be imported",
  templateData: "entities created from a template can't be imported",
  legacyId: "legacy ids can't be imported, remove the field",
};
const KEY_HINTS: Record<string, string> = {
  label: "labels",
  note: "notes",
  prop: "props",
  metaprops: "props",
  reference: "references",
  relation: "relations",
  type: "class",
};

const PROP_KEYS = [
  "id",
  "elvl",
  "certainty",
  "logic",
  "mood",
  "moodvariant",
  "bundleOperator",
  "bundleStart",
  "bundleEnd",
  "children",
  "type",
  "value",
];
const PROP_ENUMS: Record<string, Record<string, string>> = {
  elvl: EntityEnums.Elvl,
  certainty: EntityEnums.Certainty,
  logic: EntityEnums.Logic,
  moodvariant: EntityEnums.MoodVariant,
  bundleOperator: EntityEnums.Operator,
};
const PROP_SPEC_ENUMS: Record<string, Record<string, string>> = {
  elvl: EntityEnums.Elvl,
  logic: EntityEnums.Logic,
  virtuality: EntityEnums.Virtuality,
  partitivity: EntityEnums.Partitivity,
};

const PROTOCOL_TEXT_KEYS = ["project", "description", "startDate", "endDate"];
const PROTOCOL_LIST_KEYS = [
  "dataCollectionMethods",
  "guidelines",
  "detailedProtocols",
  "relatedDataPublications",
];

// database rows carry "not a template" as false, "" or 0
const isEmptyValue = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  value === false ||
  value === 0 ||
  value === "" ||
  (Array.isArray(value) && value.length === 0) ||
  (isPlainObject(value) && Object.keys(value).length === 0);

type Report = (path: string, message: string) => void;

interface Reporter {
  error: Report;
  note: Report;
}

const normalizePropSpec = (
  raw: unknown,
  path: string,
  defaults: IPropSpec,
  required: boolean,
  report: Reporter
): IPropSpec => {
  const spec = { ...defaults };

  if (raw === undefined) {
    if (required) {
      report.error(path, 'required, e.g. "type": { "entityId": "<uuid>" }');
    }
    return spec;
  }
  // "type": "<uuid>" is a shorthand for { "entityId": "<uuid>" }
  if (typeof raw === "string") {
    spec.entityId = raw;
  } else if (!isPlainObject(raw)) {
    report.error(path, 'must be an entity id or an object with "entityId"');
    return spec;
  } else {
    for (const [key, value] of Object.entries(raw)) {
      if (key === "entityId") {
        if (typeof value !== "string") {
          report.error(`${path}.entityId`, "must be an entity id");
        } else {
          spec.entityId = value;
        }
      } else if (key in PROP_SPEC_ENUMS) {
        if (isEnumValue(PROP_SPEC_ENUMS[key], value)) {
          (spec as unknown as Record<string, unknown>)[key] = value;
        } else {
          report.error(
            `${path}.${key}`,
            `must be one of ${enumList(PROP_SPEC_ENUMS[key])}; got ${quote(value)}`
          );
        }
      } else {
        report.error(`${path}.${key}`, "unknown field");
      }
    }
  }

  if (required && !spec.entityId) {
    report.error(`${path}.entityId`, "required");
  }
  return spec;
};

const normalizeProp = (raw: unknown, path: string, depth: number, report: Reporter): IProp => {
  const prop = CMetaProp();

  if (!isPlainObject(raw)) {
    report.error(path, "must be an object");
    return prop;
  }

  for (const [key, value] of Object.entries(raw)) {
    const keyPath = `${path}.${key}`;
    if (key === "id" || key === "type" || key === "value" || key === "children") {
      // ids of nested objects are always generated anew; the rest is read below
      continue;
    } else if (key in PROP_ENUMS) {
      if (isEnumValue(PROP_ENUMS[key], value)) {
        (prop as unknown as Record<string, unknown>)[key] = value;
      } else {
        report.error(keyPath, `must be one of ${enumList(PROP_ENUMS[key])}; got ${quote(value)}`);
      }
    } else if (key === "mood") {
      if (
        Array.isArray(value) &&
        value.length > 0 &&
        value.every((mood) => isEnumValue(EntityEnums.Mood, mood))
      ) {
        prop.mood = value as EntityEnums.Mood[];
      } else {
        report.error(keyPath, `must be a non-empty list of ${enumList(EntityEnums.Mood)}`);
      }
    } else if (key === "bundleStart" || key === "bundleEnd") {
      if (typeof value === "boolean") {
        prop[key] = value;
      } else {
        report.error(keyPath, "must be true or false");
      }
    } else if (PROP_KEYS.includes(key)) {
      continue;
    } else {
      report.error(keyPath, "unknown field");
    }
  }

  prop.type = normalizePropSpec(raw.type, `${path}.type`, prop.type, true, report);
  prop.value = normalizePropSpec(raw.value, `${path}.value`, prop.value, false, report);

  if (raw.children !== undefined) {
    if (!Array.isArray(raw.children)) {
      report.error(`${path}.children`, "must be a list of metaprops");
    } else if (raw.children.length > 0 && depth >= MAX_PROP_DEPTH) {
      report.error(`${path}.children`, `metaprops nest at most ${MAX_PROP_DEPTH} levels deep`);
    } else {
      prop.children = raw.children.map((child, childIndex) =>
        normalizeProp(child, `${path}.children[${childIndex}]`, depth + 1, report)
      );
    }
  }

  return prop;
};

const normalizeReference = (raw: unknown, path: string, report: Reporter): IReference => {
  const reference = CReference();

  if (!isPlainObject(raw)) {
    report.error(path, "must be an object");
    return reference;
  }

  for (const [key, value] of Object.entries(raw)) {
    if (key === "id") {
      continue;
    } else if (key === "resource" || key === "value") {
      if (typeof value === "string") {
        reference[key] = value;
      } else {
        report.error(`${path}.${key}`, "must be an entity id");
      }
    } else {
      report.error(`${path}.${key}`, "unknown field");
    }
  }

  if (!reference.resource) {
    report.error(`${path}.resource`, "required");
  }
  return reference;
};

const readTextFields = (
  raw: Record<string, unknown>,
  keys: string[],
  target: Record<string, unknown>,
  path: string,
  report: Reporter
) => {
  for (const key of keys) {
    if (raw[key] === undefined) {
      continue;
    }
    if (typeof raw[key] === "string") {
      target[key] = raw[key];
    } else {
      report.error(`${path}.${key}`, "must be a text");
    }
  }
};

const reportUnknownKeys = (
  raw: Record<string, unknown>,
  known: string[],
  path: string,
  report: Reporter
) => {
  Object.keys(raw)
    .filter((key) => !known.includes(key))
    .forEach((key) => report.error(`${path}.${key}`, "unknown field"));
};

const normalizeActionData = (raw: Record<string, unknown>, report: Reporter) => {
  const data = {
    pos: EntityEnums.ActionPartOfSpeech.Verb,
    valencies: { s: "", a1: "", a2: "" } as Record<string, string>,
    entities: {} as IActionEntity,
  };

  for (const [key, value] of Object.entries(raw)) {
    if (key === "pos") {
      if (value !== EntityEnums.ActionPartOfSpeech.Verb) {
        report.error("data.pos", `must be "${EntityEnums.ActionPartOfSpeech.Verb}"`);
      }
    } else if (key === "valencies") {
      if (!isPlainObject(value)) {
        report.error("data.valencies", "must be an object");
        continue;
      }
      reportUnknownKeys(value, ["s", "a1", "a2"], "data.valencies", report);
      readTextFields(value, ["s", "a1", "a2"], data.valencies, "data.valencies", report);
    } else if (key === "entities") {
      if (!isPlainObject(value)) {
        report.error("data.entities", "must be an object");
        continue;
      }
      reportUnknownKeys(value, ["s", "a1", "a2"], "data.entities", report);
      for (const position of ["s", "a1", "a2"] as const) {
        const classes = value[position];
        if (classes === undefined) {
          continue;
        }
        if (
          Array.isArray(classes) &&
          classes.every((entityClass) => EntityEnums.IsExtendedClass(entityClass))
        ) {
          data.entities[position] = classes as EntityEnums.ExtendedClass[];
        } else {
          report.error(`data.entities.${position}`, "must be a list of entity class codes");
        }
      }
    } else {
      report.error(`data.${key}`, "unknown field");
    }
  }

  return data;
};

const normalizeTerritoryData = (raw: Record<string, unknown>, report: Reporter) => {
  const data: { parent: { territoryId: string; order: number } | false; protocol: ITerritoryProtocol } = {
    parent: false,
    protocol: CEmptyProtocol(),
  };

  for (const [key, value] of Object.entries(raw)) {
    if (key === "parent" || key === "protocol") {
      continue;
    } else if (key === "validations") {
      if (isEmptyValue(value)) {
        report.note("data.validations", "ignored, it is empty");
      } else {
        report.error(
          "data.validations",
          "territory validation rules can't be imported; add them in Detail after the import"
        );
      }
    } else {
      report.error(`data.${key}`, "unknown field");
    }
  }

  const parent = raw.parent;
  if (parent === undefined || parent === false || parent === null) {
    report.error("data.parent", 'required, e.g. "parent": { "territoryId": "<uuid>" }');
  } else if (!isPlainObject(parent)) {
    report.error("data.parent", 'must be an object with "territoryId"');
  } else {
    reportUnknownKeys(parent, ["territoryId", "order"], "data.parent", report);
    if (!isNonEmptyString(parent.territoryId)) {
      report.error("data.parent.territoryId", "required");
    } else {
      data.parent = { territoryId: parent.territoryId, order: EntityEnums.Order.Last };
    }
    if (parent.order !== undefined) {
      report.note(
        "data.parent.order",
        "ignored; new territories are added at the end, in the order of the input"
      );
    }
  }

  const protocol = raw.protocol;
  if (protocol !== undefined) {
    if (!isPlainObject(protocol)) {
      report.error("data.protocol", "must be an object");
    } else {
      reportUnknownKeys(
        protocol,
        [...PROTOCOL_TEXT_KEYS, ...PROTOCOL_LIST_KEYS],
        "data.protocol",
        report
      );
      const target = data.protocol as unknown as Record<string, unknown>;
      readTextFields(protocol, PROTOCOL_TEXT_KEYS, target, "data.protocol", report);
      for (const key of PROTOCOL_LIST_KEYS) {
        if (protocol[key] === undefined) {
          continue;
        }
        if (isStringList(protocol[key])) {
          target[key] = protocol[key];
        } else {
          report.error(`data.protocol.${key}`, "must be a list of entity ids");
        }
      }
    }
  }

  return data;
};

const normalizeData = (
  entityClass: EntityEnums.Class,
  rawData: unknown,
  report: Reporter
): object => {
  if (rawData !== undefined && !isPlainObject(rawData)) {
    report.error("data", "must be an object");
  }
  const raw = isPlainObject(rawData) ? rawData : {};

  switch (entityClass) {
    case EntityEnums.Class.Action:
      return normalizeActionData(raw, report);

    case EntityEnums.Class.Territory:
      return normalizeTerritoryData(raw, report);

    case EntityEnums.Class.Concept: {
      const data = { pos: EntityEnums.ConceptPartOfSpeech.Empty };
      for (const [key, value] of Object.entries(raw)) {
        if (key !== "pos") {
          report.error(`data.${key}`, "unknown field");
        } else if (isEnumValue(EntityEnums.ConceptPartOfSpeech, value)) {
          data.pos = value;
        } else {
          report.error(
            "data.pos",
            `must be one of ${enumList(EntityEnums.ConceptPartOfSpeech)}; got ${quote(value)}`
          );
        }
      }
      return data;
    }

    case EntityEnums.Class.Resource: {
      const data: Record<string, unknown> = {};
      for (const key of Object.keys(raw)) {
        if (key === "documentId") {
          report.error(
            "data.documentId",
            "documents can't be attached by the import; attach it after the import"
          );
        } else if (!["url", "partValueLabel", "partValueBaseURL"].includes(key)) {
          report.error(`data.${key}`, "unknown field");
        }
      }
      readTextFields(raw, ["url", "partValueLabel", "partValueBaseURL"], data, "data", report);
      return data;
    }

    default: {
      // Person, Being, Event, Group, Location, Object and Value carry only a
      // logical type, which the server defaults when it is missing
      const data: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(raw)) {
        if (key !== "logicalType") {
          report.error(`data.${key}`, "unknown field");
        } else if (isEnumValue(EntityEnums.LogicalType, value)) {
          data.logicalType = value;
        } else {
          report.error(
            "data.logicalType",
            `must be one of ${enumList(EntityEnums.LogicalType)}; got ${quote(value)}`
          );
        }
      }
      return data;
    }
  }
};

const readList = <T,>(
  raw: unknown,
  path: string,
  report: Reporter,
  readItem: (item: unknown, itemPath: string) => T
): T[] => {
  if (raw === undefined) {
    return [];
  }
  if (!Array.isArray(raw)) {
    report.error(path, "must be a list");
    return [];
  }
  return raw.map((item, itemIndex) => readItem(item, `${path}[${itemIndex}]`));
};

/**
 * Relations come either as a list, or grouped by type the way the JSON section
 * of Detail shows them: { "SCL": { "connections": [...], "iConnections": [...] } }.
 * Both read into one list; a grouped relation takes its type from its group.
 */
const readRawRelations = (raw: unknown, report: Reporter): RawRelation[] => {
  if (raw === undefined) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw.map((item, itemIndex) => ({ path: `relations[${itemIndex}]`, raw: item }));
  }
  if (!isPlainObject(raw)) {
    report.error("relations", "must be a list, or relations grouped by type as in Detail");
    return [];
  }

  const out: RawRelation[] = [];
  for (const [type, group] of Object.entries(raw)) {
    const groupPath = `relations.${type}`;
    if (!isEnumValue(RelationEnums.Type, type)) {
      report.error(groupPath, `unknown relation type; use one of ${enumList(RelationEnums.Type)}`);
      continue;
    }
    if (!isPlainObject(group)) {
      report.error(groupPath, 'must be an object with "connections" and/or "iConnections"');
      continue;
    }
    reportUnknownKeys(group, RELATION_GROUP_KEYS, groupPath, report);
    for (const key of RELATION_GROUP_KEYS) {
      const items = group[key];
      if (items === undefined) {
        continue;
      }
      if (!Array.isArray(items)) {
        report.error(`${groupPath}.${key}`, "must be a list");
        continue;
      }
      // relations pointing at the entity belong to their source entity, which
      // sets them in its own Detail; Detail lists them here read-only
      if (key === "iConnections") {
        if (items.length) {
          report.note(
            `${groupPath}.iConnections`,
            `ignored (${items.length}); relations pointing at this entity are set from the entity they start at`
          );
        }
        continue;
      }
      items.forEach((item, itemIndex) => {
        const path = `${groupPath}.${key}[${itemIndex}]`;
        if (isPlainObject(item) && item.type !== undefined && item.type !== type) {
          report.error(`${path}.type`, `must be "${type}" or left out inside the ${type} group`);
          return;
        }
        out.push({ path, raw: isPlainObject(item) ? { ...item, type } : item });
      });
    }
  }
  return out;
};

const normalizeEntity = (
  raw: Record<string, unknown>,
  index: number,
  defaultLanguage: EntityEnums.Language,
  errors: ImportIssue[],
  notes: ImportIssue[]
): ImportEntity => {
  const label =
    Array.isArray(raw.labels) && typeof raw.labels[0] === "string" ? raw.labels[0] : undefined;
  const report: Reporter = {
    error: (path, message) => errors.push({ entityIndex: index, label, path, message }),
    note: (path, message) => notes.push({ entityIndex: index, label, path, message }),
  };

  const detailViewKeys: string[] = [];
  for (const [key, value] of Object.entries(raw)) {
    if (ENTITY_KEYS.includes(key)) {
      continue;
    } else if (SERVER_MANAGED_KEYS.includes(key)) {
      report.note(key, "ignored, set by the server");
    } else if (DETAIL_VIEW_KEYS.includes(key)) {
      detailViewKeys.push(key);
    } else if (key in TEMPLATE_KEYS) {
      if (isEmptyValue(value)) {
        report.note(key, "ignored, it is empty");
      } else {
        report.error(key, TEMPLATE_KEYS[key]);
      }
    } else {
      const hint = KEY_HINTS[key] ? `; did you mean "${KEY_HINTS[key]}"?` : "";
      report.error(key, `unknown field${hint}`);
    }
  }
  if (detailViewKeys.length) {
    report.note(
      detailViewKeys.join(", "),
      "ignored, shown by the Detail view but not part of the entity"
    );
  }

  let id = uuidv4();
  if (raw.id !== undefined) {
    if (typeof raw.id === "string" && /^\S+$/.test(raw.id)) {
      id = raw.id;
    } else {
      report.error("id", "must be a text without spaces");
    }
  }

  const entityClass = raw.class as EntityEnums.Class;
  const classIsValid = isEnumValue(EntityEnums.Class, entityClass);
  if (raw.class === undefined) {
    report.error("class", `required, one of ${enumList(EntityEnums.Class)}`);
  } else if (!classIsValid) {
    report.error("class", `must be one of ${enumList(EntityEnums.Class)}; got ${quote(raw.class)}`);
  } else if (entityClass === EntityEnums.Class.Statement) {
    report.error("class", "statements can't be imported");
  }

  let labels: string[] = [];
  if (raw.labels === undefined) {
    report.error("labels", 'required, e.g. "labels": ["dog"]');
  } else if (!isStringList(raw.labels) || raw.labels.length === 0) {
    report.error("labels", "must be a non-empty list of texts");
  } else if (!raw.labels[0].trim()) {
    report.error("labels", "the first label must not be empty");
  } else {
    labels = raw.labels;
  }

  let detail = "";
  if (raw.detail !== undefined) {
    if (typeof raw.detail === "string") {
      detail = raw.detail;
    } else {
      report.error("detail", "must be a text");
    }
  }

  let language = defaultLanguage;
  if (raw.language !== undefined) {
    if (isEnumValue(EntityEnums.Language, raw.language)) {
      language = raw.language;
    } else {
      report.error("language", `unknown language code ${quote(raw.language)}; use ISO 639-2, e.g. "eng"`);
    }
  }

  let status =
    entityClass === EntityEnums.Class.Value
      ? EntityEnums.Status.Approved
      : EntityEnums.Status.Pending;
  if (raw.status !== undefined) {
    if (isEnumValue(EntityEnums.Status, raw.status)) {
      status = raw.status;
    } else {
      report.error("status", `must be one of ${enumList(EntityEnums.Status)}; got ${quote(raw.status)}`);
    }
  }

  let entityNotes: string[] = [];
  if (raw.notes !== undefined) {
    if (isStringList(raw.notes)) {
      entityNotes = raw.notes;
    } else {
      report.error("notes", "must be a list of texts");
    }
  }

  const props = readList(raw.props, "props", report, (item, itemPath) =>
    normalizeProp(item, itemPath, 1, report)
  );
  const references = readList(raw.references, "references", report, (item, itemPath) =>
    normalizeReference(item, itemPath, report)
  );

  const data =
    classIsValid && entityClass !== EntityEnums.Class.Statement
      ? normalizeData(entityClass, raw.data, report)
      : {};

  const rawRelations = readRawRelations(raw.relations, report);

  const entity: IEntity = {
    id,
    class: entityClass,
    labels,
    detail,
    language,
    status,
    notes: entityNotes,
    props,
    references,
    data,
    isTemplate: false,
  };

  return { index, entity, rawRelations };
};

/**
 * Checks the fields of every input entity and fills what is missing with the
 * defaults the create modal and Detail use. Entities come back even when they
 * have errors, so the later checks can still report on them.
 */
export const normalizeEntities = (
  items: unknown[],
  options: { defaultLanguage: EntityEnums.Language }
): { entities: ImportEntity[]; errors: ImportIssue[]; notes: ImportIssue[] } => {
  const errors: ImportIssue[] = [];
  const notes: ImportIssue[] = [];

  const entities = items
    .map((item, itemIndex) => ({ item, index: itemIndex + 1 }))
    .filter(({ item }) => isPlainObject(item))
    .map(({ item, index }) =>
      normalizeEntity(item as Record<string, unknown>, index, options.defaultLanguage, errors, notes)
    );

  return { entities, errors, notes };
};

import { entitiesDictKeys } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { ImportIssue } from "./types";

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isEnumValue = <T extends Record<string, string | number>>(
  enumObject: T,
  value: unknown
): value is T[keyof T] => Object.values(enumObject).includes(value as T[keyof T]);

export const isEntityClass = (value: unknown): value is EntityEnums.Class =>
  isEnumValue(EntityEnums.Class, value);

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const MAX_QUOTED_LENGTH = 80;

/** The value in quotes, cut short so a pasted blob cannot flood the error list. */
export const quote = (value: unknown): string => {
  const text = typeof value === "string" ? value : JSON.stringify(value) ?? String(value);
  return text.length > MAX_QUOTED_LENGTH
    ? `"${text.slice(0, MAX_QUOTED_LENGTH)}…"`
    : `"${text}"`;
};

export const className = (entityClass: EntityEnums.Class): string =>
  entitiesDictKeys[entityClass]?.label ?? entityClass;

/** "a Concept", "a Resource or a Value" */
export const classList = (classes: EntityEnums.Class[]): string =>
  classes.map((entityClass) => `a ${className(entityClass)}`).join(" or ");

export const enumList = (enumObject: Record<string, string | number>): string =>
  Object.values(enumObject)
    .map((value) => `"${value}"`)
    .join(", ");

export const unique = <T,>(values: T[]): T[] => [...new Set(values)];

/** "1 metaprop", "2 metaprops" */
export const count = (amount: number, singular: string, plural: string) =>
  `${amount} ${amount === 1 ? singular : plural}`;

const pathKeys = (path: string) => path.match(/[^.[\]]+/g)!;

/** The field at a path such as "props[0].value.entityId". */
export const getAtPath = (target: object, path: string): unknown =>
  pathKeys(path).reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], target);

/** Sets the field at a path such as "props[0].value.entityId", in place. */
export const setAtPath = (target: object, path: string, value: unknown) => {
  const keys = pathKeys(path);
  let node = target as Record<string, unknown>;
  keys.slice(0, -1).forEach((key) => {
    node = node[key] as Record<string, unknown>;
  });
  node[keys[keys.length - 1]] = value;
};

/** `Entity 3 "sacral kingship" › props[1].type.entityId: <message>` */
export const formatIssue = (issue: ImportIssue): string => {
  const location: string[] = [];
  if (issue.entityIndex !== undefined) {
    location.push(
      issue.label ? `Entity ${issue.entityIndex} "${issue.label}"` : `Entity ${issue.entityIndex}`
    );
  }
  if (issue.path) {
    location.push(issue.path);
  }
  return location.length ? `${location.join(" › ")}: ${issue.message}` : issue.message;
};

/** The message a failed api call carries: the server's text, else its error name. */
export const errorMessage = (error: unknown): string => {
  if (isPlainObject(error) || error instanceof Error) {
    const { message, error: name } = error as { message?: unknown; error?: unknown };
    if (isNonEmptyString(message)) {
      return message;
    }
    if (isNonEmptyString(name)) {
      return name;
    }
  }
  return "unknown error";
};

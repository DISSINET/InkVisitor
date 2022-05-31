import { EntityClass, EntityExtension } from "../enums";
export type DropdownItem = { value: string; label: string; info?: string };

export const allEntities: DropdownItem = {
  value: EntityExtension.Any,
  label: "Any",
  info: "",
};

export const entitiesDictKeys = {
  A: {
    value: EntityClass.Action,
    label: "Action",
    info: "",
  },
  T: {
    value: EntityClass.Territory,
    label: "Territory",
    info: "",
  },
  S: {
    value: EntityClass.Statement,
    label: "Statement",
    info: "",
  },
  R: {
    value: EntityClass.Resource,
    label: "Resource",
    info: "",
  },
  P: {
    value: EntityClass.Person,
    label: "Person",
    info: "",
  },
  G: {
    value: EntityClass.Group,
    label: "Group",
    info: "",
  },
  O: {
    value: EntityClass.Object,
    label: "Object",
    info: "",
  },
  C: {
    value: EntityClass.Concept,
    label: "Concept",
    info: "",
  },
  L: {
    value: EntityClass.Location,
    label: "Location",
    info: "",
  },
  V: {
    value: EntityClass.Value,
    label: "Value",
    info: "",
  },
  E: {
    value: EntityClass.Event,
    label: "Event",
    info: "",
  },
};

export const classesAll = [
  EntityClass.Action,
  EntityClass.Person,
  EntityClass.Group,
  EntityClass.Object,
  EntityClass.Concept,
  EntityClass.Location,
  EntityClass.Value,
  EntityClass.Event,
  EntityClass.Statement,
  EntityClass.Territory,
  EntityClass.Resource,
];

export const entitiesDict: DropdownItem[] = classesAll.map(
  (c) => entitiesDictKeys[c]
);

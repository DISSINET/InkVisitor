import { EntityEnums } from "../enums";
export type DropdownItem = { value: string; label: string; info?: string };

export const allEntities: DropdownItem = {
  value: EntityEnums.Extension.Any,
  label: "Any",
  info: "",
};

export const entitiesDictKeys = {
  A: {
    value: EntityEnums.Class.Action,
    label: "Action",
    info: "",
  },
  T: {
    value: EntityEnums.Class.Territory,
    label: "Territory",
    info: "",
  },
  S: {
    value: EntityEnums.Class.Statement,
    label: "Statement",
    info: "",
  },
  R: {
    value: EntityEnums.Class.Resource,
    label: "Resource",
    info: "",
  },
  P: {
    value: EntityEnums.Class.Person,
    label: "Person",
    info: "",
  },
  B: {
    value: EntityEnums.Class.Being,
    label: "Living Being",
    info: "",
  },
  G: {
    value: EntityEnums.Class.Group,
    label: "Group",
    info: "",
  },
  O: {
    value: EntityEnums.Class.Object,
    label: "Object",
    info: "",
  },
  C: {
    value: EntityEnums.Class.Concept,
    label: "Concept",
    info: "",
  },
  L: {
    value: EntityEnums.Class.Location,
    label: "Location",
    info: "",
  },
  V: {
    value: EntityEnums.Class.Value,
    label: "Value",
    info: "",
  },
  E: {
    value: EntityEnums.Class.Event,
    label: "Event",
    info: "",
  },
};

export const classesAll = [
  EntityEnums.Class.Concept,
  EntityEnums.Class.Action,
  EntityEnums.Class.Person,
  EntityEnums.Class.Group,
  EntityEnums.Class.Being,
  EntityEnums.Class.Object,
  EntityEnums.Class.Location,
  EntityEnums.Class.Event,
  EntityEnums.Class.Statement,
  EntityEnums.Class.Territory,
  EntityEnums.Class.Resource,
  EntityEnums.Class.Value,
];

export const entitiesDict: DropdownItem[] = classesAll.map(
  (c) => entitiesDictKeys[c]
);

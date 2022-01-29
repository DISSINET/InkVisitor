import { DropdownItem } from "@shared/packages/client/src/types";
import { EntityClass } from "../enums";

export const allEntities: DropdownItem = {
  value: EntityClass.Any,
  label: "Any",
  info: "",
};

export const entitiesDict: DropdownItem[] = [
  {
    value: EntityClass.Action,
    label: "Action",
    info: "",
  },
  {
    value: EntityClass.Territory,
    label: "Territory",
    info: "",
  },
  {
    value: EntityClass.Statement,
    label: "Statement",
    info: "",
  },
  {
    value: EntityClass.Resource,
    label: "Resource",
    info: "",
  },
  {
    value: EntityClass.Person,
    label: "Person",
    info: "",
  },
  {
    value: EntityClass.Group,
    label: "Group",
    info: "",
  },
  {
    value: EntityClass.Object,
    label: "Object",
    info: "",
  },
  {
    value: EntityClass.Concept,
    label: "Concept",
    info: "",
  },
  {
    value: EntityClass.Location,
    label: "Location",
    info: "",
  },
  {
    value: EntityClass.Value,
    label: "Value",
    info: "",
  },
  {
    value: EntityClass.Event,
    label: "Event",
    info: "",
  },
];

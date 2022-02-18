//@ts-ignore
import { DropdownItem } from "@shared/packages/client/src/types";
import { ActantType } from "../enums";

export const allEntities: DropdownItem = {
  value: ActantType.Any,
  label: "Any",
  info: "",
};

export const entitiesDict: DropdownItem[] = [
  {
    value: ActantType.Action,
    label: "Action",
    info: "",
  },
  {
    value: ActantType.Territory,
    label: "Territory",
    info: "",
  },
  {
    value: ActantType.Statement,
    label: "Statement",
    info: "",
  },
  {
    value: ActantType.Resource,
    label: "Resource",
    info: "",
  },
  {
    value: ActantType.Person,
    label: "Person",
    info: "",
  },
  {
    value: ActantType.Group,
    label: "Group",
    info: "",
  },
  {
    value: ActantType.Object,
    label: "Object",
    info: "",
  },
  {
    value: ActantType.Concept,
    label: "Concept",
    info: "",
  },
  {
    value: ActantType.Location,
    label: "Location",
    info: "",
  },
  {
    value: ActantType.Value,
    label: "Value",
    info: "",
  },
  {
    value: ActantType.Event,
    label: "Event",
    info: "",
  },
];

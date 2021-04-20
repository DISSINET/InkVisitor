import {
  IProp,
  IStatementActant,
  IActant,
  ITerritory,
  IStatement,
} from "@shared/types";
import { CategoryActantType, ActantType } from "@shared/enums";
import { v4 as uuidv4 } from "uuid";

export const CProp = (): IProp => ({
  id: uuidv4(),
  elvl: "1",
  certainty: "1",
  modality: "1",
  origin: "",
  type: {
    id: "",
    certainty: "1",
    elvl: "1",
  },
  value: {
    id: "",
    certainty: "1",
    elvl: "1",
  },
});

export const CStatement = (territoryId: string): IStatement => ({
  id: uuidv4(),
  class: ActantType.Statement,
  label: "",
  data: {
    action: "",
    certainty: "1",
    elvl: "1",
    modality: "1",
    text: "",
    note: "",
    territory: {
      id: territoryId,
      order: -1,
    },
    actants: [],
    props: [],
    references: [],
    tags: [],
  },
});

export const CStatementActant = (): IStatementActant => ({
  id: uuidv4(),
  actant: "",
  position: "s",
  modality: "1",
  elvl: "1",
  certainty: "1",
});

export const CTerritoryActant = (
  label: string,
  parentId: string,
  parentOrder: number
): ITerritory => ({
  id: uuidv4(),
  class: ActantType.Territory,
  label: label,
  data: {
    parent: { id: parentId, order: parentOrder },
    type: "1",
    content: "",
    lang: "1",
  },
});

export const CActant = (
  category: CategoryActantType,
  label: string
): IActant => ({
  id: uuidv4(),
  class: category,
  label: label,
  data: {},
});

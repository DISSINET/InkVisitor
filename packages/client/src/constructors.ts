import {
  IProp,
  IStatementActant,
  IActant,
  ITerritory,
} from "../../shared/types";

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
  class: "T",
  label: label,
  data: {
    parent: { id: parentId, order: parentOrder },
    type: "1",
    content: "",
    lang: "1",
  },
});

export const CActant = (
  category: "P" | "G" | "O" | "C" | "L" | "V" | "E",
  label: string
): IActant => ({
  id: uuidv4(),
  class: category,
  label: label,
  data: {},
});

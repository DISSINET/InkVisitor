import {
  IStatementProp,
  IStatementActant,
  IStatementAction,
  IActant,
  ITerritory,
  IStatement,
  IBookmarkFolder,
} from "@shared/types";
import { CategoryActantType, ActantType } from "@shared/enums";
import { v4 as uuidv4 } from "uuid";

export const CBookmarkFolder = (bookmarkName: string): IBookmarkFolder => ({
  id: uuidv4(),
  name: bookmarkName,
  actantIds: [],
});

export const CProp = (): IStatementProp => ({
  id: uuidv4(),
  origin: "",
  elvl: "1",
  certainty: "1",
  logic: "1",
  mood: ["1"],
  moodvariant: "1",
  operator: "a",
  bundleStart: false,
  bundleEnd: false,

  type: {
    id: "",
    elvl: "1",
    logic: "1",
    virtuality: "1",
    partitivity: "1",
  },
  value: {
    id: "",
    elvl: "1",
    logic: "1",
    virtuality: "1",
    partitivity: "1",
  },
});

export const CStatement = (territoryId: string): IStatement => ({
  id: uuidv4(),
  class: ActantType.Statement,
  label: "",
  detail: "",
  status: "0",
  language: ["eng"],
  notes: [],
  data: {
    actions: [],
    text: "",
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

export const CMetaStatement = (subjectId: string): IStatement => ({
  id: uuidv4(),
  class: ActantType.Statement,
  label: "",
  detail: "",
  status: "0",
  language: ["eng"],
  notes: [],
  data: {
    actions: [
      {
        id: uuidv4(),
        action: "A0093",
        certainty: "1",
        elvl: "1",
        logic: "1",
        mood: ["1"],
        moodvariant: "1",
        operator: "a",
        bundleStart: false,
        bundleEnd: false,
      },
    ],
    text: "",
    territory: {
      id: "T0",
      order: -1,
    },
    actants: [
      {
        id: uuidv4(),
        actant: subjectId,
        position: "s",
        elvl: "1",
        logic: "1",
        virtuality: "1",
        partitivity: "1",
        operator: "a",
        bundleStart: false,
        bundleEnd: false,
      },
      {
        id: uuidv4(),
        actant: "",
        position: "a1",
        elvl: "1",
        logic: "1",
        virtuality: "1",
        partitivity: "1",
        operator: "a",
        bundleStart: false,
        bundleEnd: false,
      },
      {
        id: uuidv4(),
        actant: "",
        position: "a2",
        elvl: "1",
        logic: "1",
        virtuality: "1",
        partitivity: "1",
        operator: "a",
        bundleStart: false,
        bundleEnd: false,
      },
    ],
    props: [],
    references: [],
    tags: [],
  },
});

// duplicate statement
export const DStatement = (statement: IStatement): IStatement => {
  const duplicatedStatement = { ...statement };
  duplicatedStatement.id = uuidv4();
  duplicatedStatement.data.actants.map((a) => (a.id = uuidv4()));
  duplicatedStatement.data.props.map((p) => (p.id = uuidv4()));
  duplicatedStatement.data.references.map((r) => (r.id = uuidv4()));
  duplicatedStatement.data.territory.order += 0.00001;

  return duplicatedStatement;
};

export const CStatementActant = (): IStatementActant => ({
  id: uuidv4(),
  actant: "",
  position: "s",
  elvl: "1",
  logic: "1",
  virtuality: "1",
  partitivity: "1",
  operator: "a",
  bundleStart: false,
  bundleEnd: false,
});

export const CStatementAction = (actionId: string): IStatementAction => ({
  id: uuidv4(),
  action: actionId,
  elvl: "1",
  certainty: "1",
  logic: "1",
  mood: [],
  moodvariant: "1",
  operator: "a",
  bundleStart: false,
  bundleEnd: false,
});

export const CTerritoryActant = (
  label: string,
  parentId: string,
  parentOrder: number
): ITerritory => ({
  id: uuidv4(),
  class: ActantType.Territory,
  label: label,
  detail: "",
  status: "0",
  language: ["eng"],
  notes: [],
  data: {
    parent: { id: parentId, order: parentOrder },
    type: "1",
    content: "",
  },
});

export const CActant = (
  category: CategoryActantType,
  label: string
): IActant => ({
  id: uuidv4(),
  class: category,
  label: label,
  detail: "",
  data: {},
  status: "0",
  language: ["eng"],
  notes: [],
});

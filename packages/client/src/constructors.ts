import {
  IStatementProp,
  IStatementActant,
  IStatementAction,
  IActant,
  ITerritory,
  IStatement,
  IBookmarkFolder,
  IStatementReference,
} from "@shared/types";
import {
  CategoryActantType,
  ActantType,
  Certainty,
  Elvl,
  Mood,
  MoodVariant,
  Operator,
  Logic,
  Virtuality,
  Partitivity,
  ActantStatus,
  Position,
  UserRole,
  Language,
} from "@shared/enums";
import { v4 as uuidv4 } from "uuid";

export const CBookmarkFolder = (bookmarkName: string): IBookmarkFolder => ({
  id: uuidv4(),
  name: bookmarkName,
  actantIds: [],
});

export const CProp = (): IStatementProp => ({
  id: uuidv4(),
  origin: "",
  elvl: Elvl["Textual"],
  certainty: Certainty.Empty,
  logic: Logic["Positive"],
  mood: [Mood.Indication],
  moodvariant: MoodVariant.Realis,
  operator: Operator["And"],
  bundleStart: false,
  bundleEnd: false,

  type: {
    id: "",
    elvl: Elvl["Textual"],
    logic: Logic["Positive"],
    virtuality: Virtuality["Certitude"],
    partitivity: Partitivity["Unison"],
  },
  value: {
    id: "",
    elvl: Elvl["Textual"],
    logic: Logic["Positive"],
    virtuality: Virtuality["Certitude"],
    partitivity: Partitivity["Unison"],
  },
});

export const CStatement = (
  territoryId: string,
  userRole: UserRole
): IStatement => ({
  id: uuidv4(),
  class: ActantType.Statement,
  label: "",
  detail: "",
  status:
    userRole === UserRole["Admin"]
      ? ActantStatus["Approved"]
      : ActantStatus["Pending"],
  language: [Language.Latin],
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

export const CMetaStatement = (
  subjectId: string,
  userRole: UserRole
): IStatement => ({
  id: uuidv4(),
  class: ActantType.Statement,
  label: "",
  detail: "",
  status:
    userRole === UserRole["Admin"]
      ? ActantStatus["Approved"]
      : ActantStatus["Pending"],
  language: [Language.Latin],
  notes: [],
  data: {
    actions: [
      {
        id: uuidv4(),
        action: "A0093",
        certainty: Certainty.Empty,
        elvl: Elvl["Inferential"],
        logic: Logic["Positive"],
        mood: [Mood["Indication"]],
        moodvariant: MoodVariant.Realis,
        operator: Operator["And"],
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
        position: Position["Subject"],
        elvl: Elvl["Inferential"],
        logic: Logic["Positive"],
        virtuality: Virtuality["Certitude"],
        partitivity: Partitivity["Unison"],
        operator: Operator["And"],
        bundleStart: false,
        bundleEnd: false,
      },
      {
        id: uuidv4(),
        actant: "",
        position: Position["Actant1"],
        elvl: Elvl["Inferential"],
        logic: Logic["Positive"],
        virtuality: Virtuality["Certitude"],
        partitivity: Partitivity["Unison"],
        operator: Operator["And"],
        bundleStart: false,
        bundleEnd: false,
      },
      {
        id: uuidv4(),
        actant: "",
        position: Position["Actant2"],
        elvl: Elvl["Inferential"],
        logic: Logic["Positive"],
        virtuality: Virtuality["Certitude"],
        partitivity: Partitivity["Unison"],
        operator: Operator["And"],
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
  position: Position["Subject"],
  elvl: Elvl["Textual"],
  logic: Logic["Positive"],
  virtuality: Virtuality["Certitude"],
  partitivity: Partitivity["Unison"],
  operator: Operator["And"],
  bundleStart: false,
  bundleEnd: false,
});

export const CStatementAction = (actionId: string): IStatementAction => ({
  id: uuidv4(),
  action: actionId,
  certainty: Certainty.Empty,
  elvl: Elvl["Textual"],
  logic: Logic["Positive"],
  mood: [Mood["Indication"]],
  moodvariant: MoodVariant.Realis,
  operator: Operator["And"],
  bundleStart: false,
  bundleEnd: false,
});

export const CTerritoryActant = (
  label: string,
  parentId: string,
  parentOrder: number,
  userRole: UserRole
): ITerritory => ({
  id: uuidv4(),
  class: ActantType.Territory,
  label: label,
  detail: "",
  status:
    userRole === UserRole["Admin"]
      ? ActantStatus["Approved"]
      : ActantStatus["Pending"],
  language: [Language.Latin],
  notes: [],
  data: {
    parent: { id: parentId, order: parentOrder },
  },
});

export const CActant = (
  category: CategoryActantType,
  label: string,
  userRole: UserRole,
  detail?: string
): IActant => ({
  id: uuidv4(),
  class: category,
  label: label,
  detail: detail ? detail : "",
  data: {},
  status:
    userRole === UserRole["Admin"]
      ? ActantStatus["Approved"]
      : ActantStatus["Pending"],
  language: [Language.Latin],
  notes: [],
});

export const CReference = (resourceId: string): IStatementReference => ({
  id: uuidv4(),
  resource: resourceId,
  part: "",
  type: "",
});

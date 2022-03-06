import {
  IProp,
  IStatementActant,
  IStatementAction,
  IEntity,
  ITerritory,
  IStatement,
  IBookmarkFolder,
  IStatementReference,
  IEntityReference,
} from "@shared/types";
import {
  Certainty,
  Elvl,
  Mood,
  MoodVariant,
  Operator,
  Logic,
  Virtuality,
  Partitivity,
  Position,
  UserRole,
  Language,
  EntityClass,
  ReferenceType,
  EntityStatus,
  EntityReferenceSource,
} from "@shared/enums";
import { v4 as uuidv4 } from "uuid";

export const CBookmarkFolder = (bookmarkName: string): IBookmarkFolder => ({
  id: uuidv4(),
  name: bookmarkName,
  entityIds: [],
});

export const CProp = (): IProp => ({
  id: uuidv4(),
  elvl: Elvl.Textual,
  certainty: Certainty.Empty,
  logic: Logic.Positive,
  mood: [Mood.Indication],
  moodvariant: MoodVariant.Realis,
  bundleOperator: Operator.And,
  bundleStart: false,
  bundleEnd: false,
  children: [],

  type: {
    id: "",
    elvl: Elvl.Textual,
    logic: Logic.Positive,
    virtuality: Virtuality.Reality,
    partitivity: Partitivity.Unison,
  },
  value: {
    id: "",
    elvl: Elvl.Textual,
    logic: Logic.Positive,
    virtuality: Virtuality.Reality,
    partitivity: Partitivity.Unison,
  },
});

export const CStatement = (
  territoryId: string,
  userRole: UserRole,
  label?: string,
  detail?: string
): IStatement => ({
  id: uuidv4(),
  class: EntityClass.Statement,
  label: label ? label : "",
  detail: detail ? detail : "",
  language: Language.Latin,
  notes: [],
  data: {
    actions: [],
    text: "",
    territory: {
      id: territoryId,
      order: -1,
    },
    actants: [],
    references: [],
    tags: [],
  },
  props: [],
  status:
    userRole === UserRole.Admin ? EntityStatus.Approved : EntityStatus.Pending,
  references: [],
  isTemplate: false,
});

// duplicate statement
export const DStatement = (statement: IStatement): IStatement => {
  const duplicatedStatement = { ...statement };
  duplicatedStatement.id = uuidv4();

  duplicatedStatement.data.actants.map((a) => (a.id = uuidv4()));
  duplicatedStatement.props.map((p) => (p.id = uuidv4()));
  duplicatedStatement.data.references.map((r) => (r.id = uuidv4()));

  if (duplicatedStatement.data.territory) {
    duplicatedStatement.data.territory.order += 0.00001;
  }

  return duplicatedStatement;
};

export const CStatementActant = (): IStatementActant => ({
  id: uuidv4(),
  actant: "",
  position: Position.Subject,
  elvl: Elvl.Textual,
  logic: Logic.Positive,
  virtuality: Virtuality.Reality,
  partitivity: Partitivity.Unison,
  bundleOperator: Operator.And,
  bundleStart: false,
  bundleEnd: false,
  props: [],
});

export const CStatementAction = (actionId: string): IStatementAction => ({
  id: uuidv4(),
  action: actionId,
  certainty: Certainty.Empty,
  elvl: Elvl.Textual,
  logic: Logic.Positive,
  mood: [Mood.Indication],
  moodvariant: MoodVariant.Realis,
  bundleOperator: Operator.And,
  bundleStart: false,
  bundleEnd: false,
  props: [],
});

export const CTerritoryActant = (
  label: string,
  parentId: string,
  parentOrder: number,
  userRole: UserRole,
  detail?: string
): ITerritory => ({
  id: uuidv4(),
  class: EntityClass.Territory,
  label: label,
  detail: detail ? detail : "",
  language: Language.Latin,
  notes: [],
  data: {
    parent: { id: parentId, order: parentOrder },
  },
  status:
    userRole === UserRole.Admin ? EntityStatus.Approved : EntityStatus.Pending,

  props: [],
  references: [],
  isTemplate: false,
});

export const CEntity = (
  entityClass: EntityClass,
  label: string,
  userRole: UserRole,
  detail?: string
): IEntity => {
  return {
    id: uuidv4(),
    class: entityClass,
    label: label,
    detail: detail ? detail : "",
    data: {},
    status:
      userRole === UserRole.Admin
        ? EntityStatus.Approved
        : EntityStatus.Pending,
    language: Language.Latin,
    notes: [],
    props: [],
    references: [],
    isTemplate: false,
  };
};

export const CReference = (resourceId: string): IStatementReference => ({
  id: uuidv4(),
  resource: resourceId,
  part: "",
  type: ReferenceType.Primary,
});

export const CEntityReference = (
  source: EntityReferenceSource = EntityReferenceSource.WordNet,
  value: string = ""
): IEntityReference => ({
  id: uuidv4(),
  source: source,
  value: value,
});

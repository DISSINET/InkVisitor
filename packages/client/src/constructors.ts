import {
  Certainty,
  Elvl,
  EntityClass,
  EntityStatus,
  Language,
  Logic,
  Mood,
  MoodVariant,
  Operator,
  Partitivity,
  Position,
  UserRole,
  Virtuality,
} from "@shared/enums";
import {
  IBookmarkFolder,
  IEntity,
  IProp,
  IReference,
  IStatement,
  IStatementActant,
  IStatementAction,
  ITerritory,
} from "@shared/types";
import { v4 as uuidv4 } from "uuid";

export const CBookmarkFolder = (bookmarkName: string): IBookmarkFolder => ({
  id: uuidv4(),
  name: bookmarkName,
  entityIds: [],
});

export const CProp = (): IProp => ({
  id: uuidv4(),
  elvl: Elvl.Inferential,
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
    elvl: Elvl.Inferential,
    logic: Logic.Positive,
    virtuality: Virtuality.Reality,
    partitivity: Partitivity.Unison,
  },
  value: {
    id: "",
    elvl: Elvl.Inferential,
    logic: Logic.Positive,
    virtuality: Virtuality.Reality,
    partitivity: Partitivity.Unison,
  },
});

export const CMetaProp = (): IProp => ({
  id: uuidv4(),
  elvl: Elvl.Inferential,
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
    elvl: Elvl.Inferential,
    logic: Logic.Positive,
    virtuality: Virtuality.Reality,
    partitivity: Partitivity.Unison,
  },
  value: {
    id: "",
    elvl: Elvl.Inferential,
    logic: Logic.Positive,
    virtuality: Virtuality.Reality,
    partitivity: Partitivity.Unison,
  },
});

export const CStatement = (
  userRole: UserRole,
  territoryId?: string,
  label?: string,
  detail?: string
): IStatement => {
  const newStatement: IStatement = {
    id: uuidv4(),
    class: EntityClass.Statement,
    label: label ? label : "",
    detail: detail ? detail : "",
    language: Language.Latin,
    notes: [],
    data: {
      actions: [],
      text: "",
      actants: [],
      tags: [],
    },
    props: [],
    status:
      userRole === UserRole.Admin
        ? EntityStatus.Approved
        : EntityStatus.Pending,
    references: [],
    isTemplate: false,
  };
  if (territoryId) {
    newStatement.data = {
      ...newStatement.data,
      territory: {
        id: territoryId,
        order: -1,
      },
    };
  }
  return newStatement;
};

// duplicate statement
export const DStatement = (
  statement: IStatement,
  userRole: UserRole
): IStatement => {
  const duplicatedStatement: IStatement = {
    id: uuidv4(),
    class: EntityClass.Statement,
    data: { ...statement.data },
    label: statement.label + " [COPY OF]",
    detail: statement.detail,
    language: statement.language,
    notes: statement.notes,
    props: DProps(statement.props),
    references: statement.references,
    status:
      userRole === UserRole.Admin
        ? EntityStatus.Approved
        : EntityStatus.Pending,
  };

  if (statement.isTemplate) {
    duplicatedStatement.isTemplate = statement.isTemplate;
  }
  if (statement.usedTemplate) {
    duplicatedStatement.usedTemplate = statement.usedTemplate;
  }

  duplicatedStatement.data.actants.forEach((a) => {
    a.id = uuidv4();
    a.props = DProps(a.props);
  });
  duplicatedStatement.data.actions.forEach((a) => {
    a.id = uuidv4();
    a.props = DProps(a.props);
  });

  duplicatedStatement.references.forEach((r) => (r.id = uuidv4()));

  return duplicatedStatement;
};

// duplicate entity
export const DEntity = (entity: IEntity, userRole: UserRole): IEntity => {
  const duplicatedEntity: IEntity = {
    id: uuidv4(),
    class: entity.class,
    data: entity.data,
    label: entity.label + " [COPY OF]",
    detail: entity.detail,
    language: entity.language,
    notes: entity.notes,
    props: DProps(entity.props),
    references: entity.references,
    status:
      userRole === UserRole.Admin
        ? EntityStatus.Approved
        : EntityStatus.Pending,
  };

  if (entity.isTemplate) {
    duplicatedEntity.isTemplate = entity.isTemplate;
  }
  if (entity.usedTemplate) {
    duplicatedEntity.usedTemplate = entity.usedTemplate;
  }
  duplicatedEntity.references.forEach((r) => (r.id = uuidv4()));

  return duplicatedEntity;
};

export const DProps = (oldProps: IProp[]): IProp[] => {
  const newProps = [...oldProps];
  newProps.forEach((p, pi) => {
    newProps[pi].id = uuidv4();
    newProps[pi].children.forEach((pp, pii) => {
      newProps[pi].children[pii].id = uuidv4();
      newProps[pi].children[pii].children.forEach((ppp, piii) => {
        newProps[pi].children[pii].children[piii].id = uuidv4();
      });
    });
  });
  return newProps;
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

export const CReference = (
  resourceId: string = "",
  valueId: string = ""
): IReference => ({
  id: uuidv4(),
  resource: resourceId,
  value: valueId,
});

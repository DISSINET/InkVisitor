import { EntityEnums, RelationEnums, UserEnums } from "@shared/enums";
import {
  IBookmarkFolder,
  IEntity,
  IProp,
  IReference,
  Relation,
  IStatement,
  IStatementActant,
  IStatementAction,
  ITerritory,
} from "@shared/types";

import {
  IStatementClassification,
  IStatementIdentification,
} from "@shared/types/statement";
import api from "api";
import { v4 as uuidv4 } from "uuid";

export const CBookmarkFolder = (bookmarkName: string): IBookmarkFolder => ({
  id: uuidv4(),
  name: bookmarkName,
  entityIds: [],
});

export const CProp = (newStatementOrder?: number | false): IProp => ({
  id: uuidv4(),
  elvl: EntityEnums.Elvl.Textual,
  certainty: EntityEnums.Certainty.Empty,
  logic: EntityEnums.Logic.Positive,
  mood: [EntityEnums.Mood.Indication],
  moodvariant: EntityEnums.MoodVariant.Realis,
  bundleOperator: EntityEnums.Operator.And,
  bundleStart: false,
  bundleEnd: false,
  children: [],
  statementOrder: newStatementOrder,

  type: {
    entityId: "",
    elvl: EntityEnums.Elvl.Textual,
    logic: EntityEnums.Logic.Positive,
    virtuality: EntityEnums.Virtuality.Reality,
    partitivity: EntityEnums.Partitivity.Unison,
  },
  value: {
    entityId: "",
    elvl: EntityEnums.Elvl.Textual,
    logic: EntityEnums.Logic.Positive,
    virtuality: EntityEnums.Virtuality.Reality,
    partitivity: EntityEnums.Partitivity.Unison,
  },
});

export const CClassification = (
  newStatementOrder: number | false
): IStatementClassification => ({
  id: uuidv4(),
  entityId: "",
  elvl: EntityEnums.Elvl.Textual,
  logic: EntityEnums.Logic.Positive,
  certainty: EntityEnums.Certainty.Empty,
  mood: [EntityEnums.Mood.Indication],
  moodvariant: EntityEnums.MoodVariant.Realis,
  statementOrder: newStatementOrder,
});

export const CIdentification = (
  newStatementOrder: number | false
): IStatementIdentification => ({
  id: uuidv4(),
  entityId: "",
  elvl: EntityEnums.Elvl.Textual,
  logic: EntityEnums.Logic.Positive,
  certainty: EntityEnums.Certainty.Empty,
  mood: [EntityEnums.Mood.Indication],
  moodvariant: EntityEnums.MoodVariant.Realis,
  statementOrder: newStatementOrder,
});

export const CMetaProp = (): IProp => ({
  id: uuidv4(),
  elvl: EntityEnums.Elvl.Inferential,
  certainty: EntityEnums.Certainty.Empty,
  logic: EntityEnums.Logic.Positive,
  mood: [EntityEnums.Mood.Indication],
  moodvariant: EntityEnums.MoodVariant.Realis,
  bundleOperator: EntityEnums.Operator.And,
  bundleStart: false,
  bundleEnd: false,
  children: [],

  type: {
    entityId: "",
    elvl: EntityEnums.Elvl.Inferential,
    logic: EntityEnums.Logic.Positive,
    virtuality: EntityEnums.Virtuality.Reality,
    partitivity: EntityEnums.Partitivity.Unison,
  },
  value: {
    entityId: "",
    elvl: EntityEnums.Elvl.Inferential,
    logic: EntityEnums.Logic.Positive,
    virtuality: EntityEnums.Virtuality.Reality,
    partitivity: EntityEnums.Partitivity.Unison,
  },
});

export const CStatement = (
  userRole: UserEnums.Role,
  territoryId?: string,
  label?: string,
  detail?: string
): IStatement => {
  const newStatement: IStatement = {
    id: uuidv4(),
    class: EntityEnums.Class.Statement,
    label: label ? label : "",
    detail: detail ? detail : "",
    language: EntityEnums.Language.Latin,
    notes: [],
    data: {
      actions: [],
      text: "",
      actants: [],
      tags: [],
    },
    props: [],
    status:
      userRole === UserEnums.Role.Admin
        ? EntityEnums.Status.Approved
        : EntityEnums.Status.Pending,
    references: [],
    isTemplate: false,
  };
  if (territoryId) {
    newStatement.data = {
      ...newStatement.data,
      territory: {
        territoryId: territoryId,
        order: -1,
      },
    };
  }
  return newStatement;
};

export const InstProps: any = async (
  oldProps: IProp[],
  userRole: UserEnums.Role
) => {
  const newProps = [...oldProps];

  const validateInstProp: any = async (
    prop: IProp,
    userRole: UserEnums.Role
  ) => {
    // type
    if (prop.type.entityId) {
      const typeEntityReq = await api.entitiesGet(prop.type.entityId);

      if (typeEntityReq && typeEntityReq.data) {
        if (typeEntityReq.data.isTemplate) {
          const newTypeEId = await InstTemplate(typeEntityReq.data, userRole);
          if (newTypeEId) {
            prop.type.entityId = newTypeEId;
          }
        }
      }
    }

    // value
    if (prop.value.entityId) {
      const valueEntityReq = await api.entitiesGet(prop.value.entityId);

      if (valueEntityReq && valueEntityReq.data) {
        if (valueEntityReq.data.isTemplate) {
          const newValueEId = await InstTemplate(valueEntityReq.data, userRole);
          if (newValueEId) {
            prop.value.entityId = newValueEId;
          }
        }
      }
    }

    return prop;
  };

  for (const [pi1, prop1] of newProps.entries()) {
    for (const [pi2, prop2] of prop1.children.entries()) {
      for (const [pi3, prop3] of prop2.children.entries()) {
        prop2.children[pi3] = await validateInstProp(prop3, userRole);
      }
      prop1.children[pi2] = await validateInstProp(prop2, userRole);
    }

    newProps[pi1] = await validateInstProp(prop1, userRole);
  }
  return newProps;
};

export const InstActant = async (
  actant: IStatementActant,
  userRole: UserEnums.Role
) => {
  actant.props = await InstProps(actant.props, userRole);

  const eReq = await api.entitiesGet(actant.entityId);
  const actantE = eReq.data;

  if (actantE && actantE.isTemplate) {
    const instActantId = await InstTemplate(actantE, userRole);
    if (instActantId) {
      actant.entityId = instActantId;
    }
  }
  return actant;
};

export const InstAction: any = async (
  action: IStatementAction,
  userRole: UserEnums.Role
) => {
  action.props = await InstProps(action.props, userRole);

  const eReq = await api.entitiesGet(action.actionId);
  const actionE = eReq.data;

  if (actionE && actionE.isTemplate) {
    const instActionId = await InstTemplate(actionE, userRole);

    if (instActionId) {
      action.actionId = instActionId;
    }
  }
  return action;
};

// not used anymore
// export const InstReference: any = async (
//   reference: IReference,
//   userRole: UserEnums.Role
// ) => {
//   if (reference.resource) {
//     const resourceEReq = await api.entitiesGet(reference.resource);

//     if (resourceEReq && resourceEReq.data) {
//       if (resourceEReq.data.isTemplate) {
//         const newResourceEId = await InstTemplate(resourceEReq.data, userRole);
//         if (newResourceEId) {
//           reference.resource = newResourceEId;
//         }
//       }
//     }
//   }

//   if (reference.value) {
//     const valueEReq = await api.entitiesGet(reference.value);

//     if (valueEReq && valueEReq.data) {
//       if (valueEReq.data.isTemplate) {
//         const newValueEId = await InstTemplate(valueEReq.data, userRole);
//         if (newValueEId) {
//           reference.value = newValueEId;
//         }
//       }
//     }
//   }

//   return reference;
// };

// instantiate template
// TODO #952 handle conflicts in Templates application

export const InstTemplate = async (
  templateEntity: IEntity | IStatement,
  userRole: UserEnums.Role
): Promise<string | false> => {
  if (templateEntity.isTemplate) {
    let iEntity: false | IEntity = false;
    if (templateEntity.class === EntityEnums.Class.Statement) {
      // entity is a statement
      iEntity = DStatement(templateEntity as IStatement, userRole);
      for (const [ai, action] of iEntity.data.actions.entries()) {
        iEntity.data.actions[ai] = await InstAction(action, userRole);
      }
      for (const [ai, actant] of iEntity.data.actants.entries()) {
        iEntity.data.actants[ai] = await InstActant(actant, userRole);
      }
    } else {
      // entity is not a statement
      iEntity = DEntity({ ...templateEntity }, userRole);
    }

    if (iEntity) {
      iEntity.label = `[INSTANCE OF] ${templateEntity.label}`;
      iEntity.usedTemplate = templateEntity.id;
      iEntity.props = await InstProps(templateEntity.props);
      iEntity.isTemplate = false;

      // references are not relevant for templates
      // for (const [ri, reference] of iEntity.references.entries()) {
      //   const iReference: IReference = await InstReference(reference, userRole);
      //   iEntity.references[ri] = iReference;
      // }
    }

    const createReq = await api.entityCreate(iEntity);
    if (createReq) {
      return iEntity.id;
    }
  }

  return false;
};

// apply template
export const applyTemplate = async (
  templateEntity: IEntity | IStatement,
  entity: IEntity | IStatement,
  userRole: UserEnums.Role
): Promise<IEntity> => {
  if (templateEntity.isTemplate && templateEntity.class === entity.class) {
    const newEntity = { ...templateEntity };

    if (templateEntity.class === EntityEnums.Class.Statement) {
      // entity is a statement
      for (const [ai, action] of newEntity.data.actions.entries()) {
        console.log(action);
        newEntity.data.actions[ai] = await InstAction(action, userRole);
      }
      for (const [ai, actant] of newEntity.data.actants.entries()) {
        newEntity.data.actants[ai] = await InstActant(actant, userRole);
      }

      newEntity.data.territory = entity.data.territory;
    } else {
      // entity is not a statement
    }

    if (newEntity) {
      newEntity.id = entity.id;
      newEntity.label = `[INSTANCE OF] ${templateEntity.label}`;
      newEntity.usedTemplate = templateEntity.id;
      newEntity.props = await InstProps(templateEntity.props);
      newEntity.isTemplate = false;
    }

    return newEntity;
  } else {
    return entity;
  }
};

// duplicate statement
export const DStatement = (
  statement: IStatement,
  userRole: UserEnums.Role
): IStatement => {
  const duplicatedStatement: IStatement = {
    id: uuidv4(),
    class: EntityEnums.Class.Statement,
    data: { ...statement.data },
    label: `[COPY OF] ${statement.label}`,
    detail: statement.detail,
    language: statement.language,
    notes: statement.notes,
    props: DProps(statement.props),
    references: statement.references,
    status:
      userRole === UserEnums.Role.Admin
        ? EntityEnums.Status.Approved
        : EntityEnums.Status.Pending,
    isTemplate: statement.isTemplate,
    usedTemplate: statement.usedTemplate,
  };

  duplicatedStatement.data.actants.forEach((a) => {
    a.id = uuidv4();
    a.props = DProps(a.props);
  });

  duplicatedStatement.data.actions.forEach((a) => {
    a.id = uuidv4();
    a.props = DProps(a.props);
  });

  // recreate connections to sources with new ids
  duplicatedStatement.references.forEach((r) => (r.id = uuidv4()));

  return duplicatedStatement;
};

// duplicate entity
export const DEntity = (entity: IEntity, userRole: UserEnums.Role): IEntity => {
  const duplicatedEntity: IEntity = {
    id: uuidv4(),
    class: entity.class,
    data: entity.data,
    label: `[COPY OF] ${entity.label}`,
    detail: entity.detail,
    language: entity.language,
    notes: entity.notes,
    props: DProps(entity.props),
    references: entity.references,
    status:
      userRole === UserEnums.Role.Admin
        ? EntityEnums.Status.Approved
        : EntityEnums.Status.Pending,
    isTemplate: entity.isTemplate,
    usedTemplate: entity.usedTemplate,
  };

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

export const CStatementActant = (
  entityId: string,
  newStatementOrder: number | false
): IStatementActant => ({
  id: uuidv4(),
  entityId: entityId,
  position: EntityEnums.Position.Subject,
  elvl: EntityEnums.Elvl.Textual,
  logic: EntityEnums.Logic.Positive,
  virtuality: EntityEnums.Virtuality.Reality,
  partitivity: EntityEnums.Partitivity.Unison,
  bundleOperator: EntityEnums.Operator.And,
  bundleStart: false,
  bundleEnd: false,
  props: [],
  classifications: [],
  identifications: [],
  statementOrder: newStatementOrder,
});

export const CStatementAction = (
  actionId: string,
  newStatementOrder: number | false
): IStatementAction => ({
  id: uuidv4(),
  actionId: actionId,
  certainty: EntityEnums.Certainty.Empty,
  elvl: EntityEnums.Elvl.Textual,
  logic: EntityEnums.Logic.Positive,
  mood: [EntityEnums.Mood.Indication],
  moodvariant: EntityEnums.MoodVariant.Realis,
  bundleOperator: EntityEnums.Operator.And,
  bundleStart: false,
  bundleEnd: false,
  props: [],
  statementOrder: newStatementOrder,
});

export const CTerritoryActant = (
  label: string,
  parentId: string,
  parentOrder: number,
  userRole: UserEnums.Role,
  detail?: string
): ITerritory => ({
  id: uuidv4(),
  class: EntityEnums.Class.Territory,
  label: label,
  detail: detail ? detail : "",
  language: EntityEnums.Language.Latin,
  notes: [],
  data: {
    parent: { territoryId: parentId, order: parentOrder },
  },
  status:
    userRole === UserEnums.Role.Admin
      ? EntityEnums.Status.Approved
      : EntityEnums.Status.Pending,

  props: [],
  references: [],
  isTemplate: false,
});

export const CEntity = (
  entityClass: EntityEnums.Class,
  label: string,
  userRole: UserEnums.Role,
  detail?: string
): IEntity => {
  return {
    id: uuidv4(),
    class: entityClass,
    label: label,
    detail: detail ? detail : "",
    data: {},
    status:
      userRole === UserEnums.Role.Admin
        ? EntityEnums.Status.Approved
        : EntityEnums.Status.Pending,
    language: EntityEnums.Language.Latin,
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

export const CRelationIdentity = (
  entity1: string = "",
  entity2: string = ""
): Relation.IIdentification => ({
  id: uuidv4(),
  entityIds: [entity1, entity2],
  type: RelationEnums.Type.Identification,
  //logic: EntityEnums.Logic.Positive,
  certainty: EntityEnums.Certainty.Certain,
});

export const CTemplateEntity = (
  entity: IEntity,
  templateLabel: string,
  templateDetail?: string
): IEntity => {
  const userRole = localStorage.getItem("userrole") as UserEnums.Role;
  const templateEntity =
    entity.class === EntityEnums.Class.Statement
      ? DStatement(entity as IStatement, userRole)
      : DEntity(entity as IEntity, userRole);

  if (entity.class === EntityEnums.Class.Statement) {
    delete templateEntity.data["territory"];
  }
  if (entity.class === EntityEnums.Class.Territory) {
    templateEntity.data["parent"] = false;
  }

  templateEntity.isTemplate = true;
  templateEntity.usedTemplate = "";
  templateEntity.label = templateLabel;

  if (templateDetail) {
    templateEntity.detail = templateDetail;
  }

  return templateEntity;
};

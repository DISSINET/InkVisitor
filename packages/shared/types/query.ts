import { EntityEnums } from "../enums";

export namespace Query {
  export interface INode {
    id: string;
    type: NodeType;
    params: INodeParams;
    operator: NodeOperator;
    edges: IEdge[];
  }

  export interface IEdge {
    id: string;
    type: EdgeType;
    params: IEdgeParams;
    logic: EdgeLogic;
    node: INode;
  }

  export interface INodeParams {
    classes?: EntityEnums.Class[];
    label?: string;
    id?: string;
  }
  export interface IEdgeParams {}

  export enum NodeType {
    X = "Entity",
    C = "Concept",
    A = "Action",
    S = "Statement",
    R = "Resource",
    T = "Territory",
  }
  export enum EdgeType {
    XHasPropType = "X_has_proptype",
    XHasPropValue = "X_has_propvalue",
    XIsInS = "X_is_in_S",
    AIsActionInS = "A_is_action_in_S",
    XIsSubjectInS = "X_is_subject_in_S",
    XIsActant1InS = "X_is_actant_1_in_S",
    XIsActant2InS = "X_is_actant_2_in_S",
    SUnderT = "S_under_T",
    XHasReferenceR = "X_has_reference_R",
    THasChildT = "T_has_child_T",
    XHasSPropTypeC = "X_has_S_proptype_C",
    XHasSPropValue = "X_has_S_propvalue",
    XHasSIdentification = "X_has_S_identification",
    XHasSClassification = "X_has_S_classification",
    XHasRelation = "X_has_relation",
    XHasSuperclass = "X_has_superclass",
    XHasClassification = "X_has_classification",
  }
  export enum NodeOperator {
    And = "and",
    Or = "or",
  }
  export enum EdgeLogic {
    Positive = "positive",
    Negative = "negative",
  }
}

export namespace Explore {
  export interface IExplore {
    view: IView; // information about the presentation form
    columns: IExploreColumn[];
    filters: IExploreColumnFilter[];
    sort: IExploreColumnSort | undefined;
    limit: number;
    offset: number;
  }

  export interface IView {}

  export interface IExploreColumnFilter {}

  export type IExploreColumnSort = {
    columnId: string;
    direction: IExploreColumnSortDirection;
  };
  export type IExploreColumnSortDirection = "asc" | "desc";

  export interface IExploreColumn {
    id: string;
    name: string;
    type: EExploreColumnType;
    params: IExploreColumnParams<EExploreColumnType>;
  }

  export enum EExploreColumnType {
    ER = "ER", // Entity Relations
    EPV = "EPV", // Entity Property value
    EPT = "EPT", // Entity Property types
    ERR = "ERR", // Entity Reference Resources
    ERV = "ERV", // Entity Reference Values
    ES = "ES", // Entity Statements
    CPV = "CPV", // Property values
    CPO = "CPO", // Property type origins
    EUC = "EUC", // Created by
    EUE = "EUE", // Edited by
    EUEN = "EUEN", // Number of edits
    EDC = "EDC", // Creation date
  }

  export const EExploreColumnTypeLabels: Record<EExploreColumnType, string> = {
    [EExploreColumnType.ER]: "Entity Relations",
    [EExploreColumnType.EPV]: "Entity Property value",
    [EExploreColumnType.EPT]: "Entity Property types",
    [EExploreColumnType.ERR]: "Entity Reference Resources",
    [EExploreColumnType.ERV]: "Entity Reference Values",
    [EExploreColumnType.ES]: "Entity Statements",
    [EExploreColumnType.CPV]: "Property values",
    [EExploreColumnType.CPO]: "Property type origins",
    [EExploreColumnType.EUC]: "Created by",
    [EExploreColumnType.EUE]: "Edited by",
    [EExploreColumnType.EUEN]: "Number of edits",
    [EExploreColumnType.EDC]: "Creation date",
  };

  export const EExploreColumnTypeDisabled: Record<
    EExploreColumnType,
    { disabled: boolean }
  > = {
    [EExploreColumnType.ER]: { disabled: true },
    [EExploreColumnType.EPV]: { disabled: false },
    [EExploreColumnType.EPT]: { disabled: true },
    [EExploreColumnType.ERR]: { disabled: true },
    [EExploreColumnType.ERV]: { disabled: true },
    [EExploreColumnType.ES]: { disabled: true },
    [EExploreColumnType.CPV]: { disabled: true },
    [EExploreColumnType.CPO]: { disabled: true },
    [EExploreColumnType.EUC]: { disabled: true },
    [EExploreColumnType.EUE]: { disabled: true },
    [EExploreColumnType.EUEN]: { disabled: true },
    [EExploreColumnType.EDC]: { disabled: true },
  };

  export type ExploreColumnParamsMap = {
    [EExploreColumnType.ER]: {};
    [EExploreColumnType.EPV]: { propertyType: string };
    [EExploreColumnType.EPT]: {};
    [EExploreColumnType.ERR]: {};
    [EExploreColumnType.ERV]: {};
    [EExploreColumnType.ES]: {};
    [EExploreColumnType.CPV]: {};
    [EExploreColumnType.CPO]: {};
    [EExploreColumnType.EUC]: {};
    [EExploreColumnType.EUE]: {};
    [EExploreColumnType.EUEN]: {};
    [EExploreColumnType.EDC]: {};
  };

  export type IExploreColumnParams<
    T extends EExploreColumnType = EExploreColumnType
  > = ExploreColumnParamsMap[T];
}

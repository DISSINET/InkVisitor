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
    ER = "ER",
    EPV = "EPV",
    EPT = "EPT",
    ERR = "ERR",
    ERV = "ERV",
    ES = "ES",
    CPV = "CPV",
    CPO = "CPO",
    EUC = "EUC",
    EUE = "EUE",
    EUEN = "EUEN",
    EDC = "EDC",
  }

  export interface IExploreColumnParams<T = EExploreColumnType> {
    [EExploreColumnType.ER]: {};
    [EExploreColumnType.EPV]: {
      propertyType: string;
    };
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
  }
}

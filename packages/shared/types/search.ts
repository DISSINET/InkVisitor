import { EntityEnums } from "./../enums";

export namespace Search {
  export interface ISearchNode {
    type: SearchNodeType;
    params: ISearchNodeParams;
    operator: SearchNodeOperator;
    edges: ISearchEdge[];
  }

  export interface ISearchEdge {
    type: SearchEdgeType;
    params: ISearchEdgeParams;
    logic: SearchEdgeLogic;
    node: ISearchNode;
  }

  export interface ISearchNodeParams {
    classes?: EntityEnums.Class[];
    label?: string;
    id?: string;
  }
  export interface ISearchEdgeParams {}

  export enum SearchNodeType {
    X = "Entity",
    C = "Concept",
    A = "Action",
    S = "Statement",
    R = "Resource",
    T = "Territory",
  }
  export enum SearchEdgeType {
    XHasProptype = "X_has_proptype",
    XHasPropvalue = "X_has_propvalue",
    XHasSuperclass = "X_has_superclass",
    XHasClassification = "X_has_classification",
    // actant in statement
    SHasXAsActant = "S_has_X_as_actant",
    XIsActantInS = "X_is_actant_in_S",
    // statement in territory
    THasS = "T_has_S",
    SIsInT = "S_is_in_T",
  }
  export enum SearchNodeOperator {
    And = "and",
    Or = "or",
  }
  export enum SearchEdgeLogic {
    Positive = "positive",
    Negative = "negative",
  }
}

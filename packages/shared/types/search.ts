import { EntityEnums } from "./../enums";

export namespace Search {
  export interface INode {
    type: NodeType;
    params: INodeParams;
    operator: NodeOperator;
    edges: IEdge[];
  }

  export interface IEdge {
    type: EdgeType;
    params: IEdgeParams;
    logic: EdgeLogic;
    node?: INode;
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
  export enum NodeOperator {
    And = "and",
    Or = "or",
  }
  export enum EdgeLogic {
    Positive = "positive",
    Negative = "negative",
  }
}

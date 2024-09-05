import { EntityEnums } from "@shared/enums";
import { Query } from "@shared/types";

const queryStateInitial: Query.INode = {
  type: Query.NodeType.X,
  params: {
    classes: [EntityEnums.Class.Person],
    label: "",
  },
  operator: Query.NodeOperator.And,
  edges: [
    {
      type: Query.EdgeType.XHasPropType,
      params: {},
      logic: Query.EdgeLogic.Positive,
      node: {
        type: Query.NodeType.C,
        params: {
          id: "4ce5e669-d421-40c9-b1ce-f476fdd171fe", //sex
          classes: [],
          label: "",
        },
        operator: Query.NodeOperator.And,
        edges: [],
      },
    },
  ],
};

interface QueryAction {
  type: QueryActionType;
  payload: any;
}
enum QueryActionType {
  addNode,
  removeNode,
  addEdge,
  removeEdge,
}

const queryReducer = (state: Query.INode, action: QueryAction) => {
  switch (action.type) {
    case QueryActionType.addNode:
      return state;
    case QueryActionType.removeNode:
      return state;
    case QueryActionType.addEdge:
      return state;
    case QueryActionType.removeEdge:
      return state;
    default:
      return state;
  }
};

const queryDiff = (state1: Query.INode, state2: Query.INode) => {
  return true;
};

export {
  queryStateInitial,
  QueryAction,
  QueryActionType,
  queryDiff,
  queryReducer,
};

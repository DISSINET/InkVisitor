import { Query } from "@shared/types";

const queryStateInitial: Query.INode = {
  type: Query.NodeType.X,
  params: {
    classes: [],
    label: "",
  },
  edges: [],
  operator: Query.NodeOperator.And,
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

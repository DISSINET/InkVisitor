import { EntityEnums } from "@shared/enums";
import { Query } from "@shared/types";
import { v4 as uuidv4 } from "uuid";
import { getAllEdges, getAllNodes } from "./utils";

const queryStateInitial: Query.INode = {
  type: Query.NodeType.X,
  id: "root",
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
      id: "e1",
      node: {
        id: "n1",
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
  removeEdge,
  updateEdgeType,
}

const queryReducer = (state: Query.INode, action: QueryAction) => {
  switch (action.type) {
    case QueryActionType.addNode:
      const parentNodeId = action.payload.parentId;

      const newEdge: Query.IEdge = {
        type: Query.EdgeType.XHasPropType,
        id: uuidv4(),
        params: {},
        logic: Query.EdgeLogic.Positive,
        node: {
          type: Query.NodeType.X,
          id: uuidv4(),
          params: {
            classes: [EntityEnums.Class.Person],
            label: "",
          },
          operator: Query.NodeOperator.And,
          edges: [],
        },
      };
      const updatedState = { ...state };

      const allNodes = getAllNodes(updatedState);
      const parentNode = allNodes.find((node) => node.id === parentNodeId);
      if (!parentNode) {
        return updatedState;
      }
      parentNode.edges.push(newEdge);
      return updatedState;

    case QueryActionType.removeEdge:
      const edgeToRemove = action.payload.edgeId;
      const updatedStateRemove = { ...state };

      const allNodes2 = getAllNodes(updatedStateRemove);
      const allEdges = getAllEdges(updatedStateRemove);

      const edge = allEdges.find((edge) => edge.id === edgeToRemove);
      if (!edge) {
        return updatedStateRemove;
      }
      const parentNode2 = allNodes2.find((node) =>
        node.edges.some((e) => e.id === edgeToRemove)
      );
      if (!parentNode2) {
        return updatedStateRemove;
      }
      parentNode2.edges = parentNode2.edges.filter(
        (e) => e.id !== edgeToRemove
      );

      return updatedStateRemove;

    case QueryActionType.updateEdgeType:
      const edgeId = action.payload.edgeId;
      const newType = action.payload.newType;

      const updatedStateUpdate = { ...state };

      const allEdges2 = getAllEdges(updatedStateUpdate);
      const edgeToUpdate = allEdges2.find((edge) => edge.id === edgeId);
      if (!edgeToUpdate) {
        return updatedStateUpdate;
      }
      edgeToUpdate.type = newType;
      return updatedStateUpdate;

    default:
      return state;
  }
};

const queryDiff = (state1: Query.INode, state2: Query.INode) => {
  return true;
};

export {
  QueryAction,
  QueryActionType,
  queryDiff,
  queryReducer,
  queryStateInitial,
};

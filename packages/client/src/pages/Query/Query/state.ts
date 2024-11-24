import { EntityEnums } from "@shared/enums";
import { Query } from "@shared/types";
import { v4 as uuidv4 } from "uuid";
import { getAllEdges, getAllNodes } from "./utils";
import { update } from "@react-spring/web";

const queryStateInitial: Query.INode = {
  type: Query.NodeType.E,
  id: "root",
  params: {
    classes: [EntityEnums.Class.Concept],
    label: "",
  },
  operator: Query.NodeOperator.And,
  edges: [
    // {
    //   type: Query.EdgeType["EP:T"],
    //   params: {},
    //   logic: Query.EdgeLogic.Positive,
    //   id: "e1",
    //   node: {
    //     id: "n1",
    //     type: Query.NodeType.E,
    //     params: {
    //       id: "4ce5e669-d421-40c9-b1ce-f476fdd171fe", //sex
    //       classes: [],
    //       label: "",
    //     },
    //     operator: Query.NodeOperator.And,
    //     edges: [],
    //   },
    // },
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
  updateNodeType,
  updateNodeClass,
  updateNodeEntityId,
}

const queryReducer = (state: Query.INode, action: QueryAction) => {
  switch (action.type) {
    case QueryActionType.addNode:
      return addNode(state, action.payload.parentId);

    case QueryActionType.removeEdge:
      const edgeToRemove = action.payload.edgeId;
      const updatedStateRemove = { ...state };

      const edge = getAllEdges(updatedStateRemove).find(
        (edge) => edge.id === edgeToRemove
      );
      if (!edge) {
        return updatedStateRemove;
      }
      const parentNode2 = getAllNodes(updatedStateRemove).find((node) =>
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

      const edgeToUpdate = getAllEdges(updatedStateUpdate).find(
        (edge) => edge.id === edgeId
      );
      if (!edgeToUpdate) {
        return updatedStateUpdate;
      }
      edgeToUpdate.type = newType;
      return updatedStateUpdate;

    case QueryActionType.updateNodeType:
      return updateNodeType(
        state,
        action.payload.nodeId,
        action.payload.newType
      );

    case QueryActionType.updateNodeClass:
      return updateNodeClass(
        state,
        action.payload.nodeId,
        action.payload.newClasses
      );

    case QueryActionType.updateNodeEntityId:
      return updateNodeEntityId(
        state,
        action.payload.nodeId,
        action.payload.newId
      );

    default:
      return state;
  }
};

const updateNodeClass = (
  state: Query.INode,
  nodeId: string,
  newClasses: EntityEnums.Class[]
): Query.INode => {
  const updatedState = { ...state };

  const nodeToUpdate = getAllNodes(updatedState).find(
    (node) => node.id === nodeId
  );
  if (!nodeToUpdate) {
    return updatedState;
  }
  nodeToUpdate.params.classes = newClasses;

  return updatedState;
};

const updateNodeEntityId = (
  state: Query.INode,
  nodeId: string,
  newId: string | undefined
): Query.INode => {
  const updatedState = { ...state };

  const nodeToUpdate = getAllNodes(updatedState).find(
    (node) => node.id === nodeId
  );
  if (!nodeToUpdate) {
    return updatedState;
  }
  if (newId === undefined) {
    delete nodeToUpdate.params.id;
  } else {
    nodeToUpdate.params.id = newId;
    nodeToUpdate.params.classes = [];
  }

  return updatedState;
};

const updateNodeType = (
  state: Query.INode,
  nodeId: string,
  newType: Query.NodeType
): Query.INode => {
  const updatedState = { ...state };

  const nodeToUpdate = getAllNodes(updatedState).find(
    (node) => node.id === nodeId
  );
  if (!nodeToUpdate) {
    return updatedState;
  }
  nodeToUpdate.type = newType;

  return updatedState;
};

const addNode = (state: Query.INode, parentId: string): Query.INode => {
  const newEdge: Query.IEdge = {
    type: Query.EdgeType["EP:T"],
    id: uuidv4(),
    params: {},
    logic: Query.EdgeLogic.Positive,
    node: {
      type: Query.NodeType.E,
      id: uuidv4(),
      params: {
        classes: [],
        label: "",
      },
      operator: Query.NodeOperator.And,
      edges: [],
    },
  };
  const updatedState = { ...state };

  const parentNode = getAllNodes(updatedState).find(
    (node) => node.id === parentId
  );
  if (!parentNode) {
    return updatedState;
  }
  parentNode.edges.push(newEdge);
  return updatedState;
};

const queryDiff = (state1: Query.INode, state2: Query.INode) => {
  return false;
};

export {
  QueryAction,
  QueryActionType,
  queryDiff,
  queryReducer,
  queryStateInitial,
};

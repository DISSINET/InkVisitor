import { EntityEnums } from "@shared/enums";
import { Query } from "@shared/types";
import { v4 as uuidv4 } from "uuid";
import { getAllEdges, getAllNodes } from "./utils";

const queryStateInitial: Query.INode = {
  type: Query.NodeType.E,
  id: "root",
  params: {
    entityClasses: [EntityEnums.Class.Concept],
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
    //       entityId: "4ce5e669-d421-40c9-b1ce-f476fdd171fe", //sex
    //       entityClasses: [],
    //       label: "",
    //     },
    //     operator: Query.NodeOperator.And,
    //     edges: [],
    //   },
    // },
  ],
};

enum QueryActionType {
  addNode,
  removeEdge,
  updateEdgeType,
  updateNodeType,
  updateNodeClass,
  updateNodeEntityId,
}

type QueryAction =
  | {
      type: QueryActionType.addNode;
      payload: { parentId: string };
    }
  | {
      type: QueryActionType.removeEdge;
      payload: { edgeId: string };
    }
  | {
      type: QueryActionType.updateEdgeType;
      payload: { edgeId: string; newType: Query.EdgeType };
    }
  | {
      type: QueryActionType.updateNodeType;
      payload: { nodeId: string; newType: Query.NodeType };
    }
  | {
      type: QueryActionType.updateNodeClass;
      payload: { nodeId: string; newEntityClasses: EntityEnums.Class[] };
    }
  | {
      type: QueryActionType.updateNodeEntityId;
      payload: { nodeId: string; newEntityId: string | undefined };
    };

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
        action.payload.newEntityClasses
      );

    case QueryActionType.updateNodeEntityId:
      return updateNodeEntityId(
        state,
        action.payload.nodeId,
        action.payload.newEntityId
      );

    default:
      return state;
  }
};

const updateNodeClass = (
  state: Query.INode,
  nodeId: string,
  newEntityClasses: EntityEnums.Class[]
): Query.INode => {
  const updatedState = { ...state };

  const nodeToUpdate = getAllNodes(updatedState).find(
    (node) => node.id === nodeId
  );
  if (!nodeToUpdate) {
    return updatedState;
  }
  nodeToUpdate.params.entityClasses = newEntityClasses;

  return updatedState;
};

const updateNodeEntityId = (
  state: Query.INode,
  nodeId: string,
  newEntityId: string | undefined
): Query.INode => {
  const updatedState = { ...state };

  const nodeToUpdate = getAllNodes(updatedState).find(
    (node) => node.id === nodeId
  );
  if (!nodeToUpdate) {
    return updatedState;
  }
  if (newEntityId === undefined) {
    delete nodeToUpdate.params.entityId;
  } else {
    nodeToUpdate.params.entityId = newEntityId;
    nodeToUpdate.params.entityClasses = [];
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
        entityClasses: [],
        label: "",
      },
      operator: Query.NodeOperator.And,
      edges: [],
    },
  };

  // Recursively clone the node tree, adding the new edge to the parent node
  const cloneNode = (node: Query.INode): Query.INode => {
    if (node.id === parentId) {
      // Found the parent node - create a new node with the new edge added
      return {
        ...node,
        edges: [...node.edges, newEdge],
      };
    }
    // Not the parent - recursively clone children
    return {
      ...node,
      edges: node.edges.map((edge) => ({
        ...edge,
        node: cloneNode(edge.node),
      })),
    };
  };

  return cloneNode(state);
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

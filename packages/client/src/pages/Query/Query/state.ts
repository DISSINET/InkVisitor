import { EntityEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types";
import { v4 as uuidv4 } from "uuid";
import { NODE_FILTER_KEYS, getAllEdges, getAllNodes, getEdgeSourceNode } from "./utils";
import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import { deepCopy } from "utils/utils";
import { getEdgeSourceClasses, getRelationConstrainedCategoryTypes } from "../utils";

const queryStateInitial: Query.INode = {
  type: Query.NodeType.E,
  id: "root",
  params:
    // only show in development mode
    process.env.NODE_ENV === "development"
      ? {
          entityClasses: classesAll,
        }
      : {
          entityClasses: classesAll,
        },
  operator: Query.NodeOperator.And,
  edges:
    // only show in development mode
    process.env.NODE_ENV === "development"
      ? [
          // {
          //   type: Query.EdgeType["EUT:"],
          //   params: {},
          //   logic: Query.EdgeLogic.Positive,
          //   id: "e1",
          //   node: {
          //     id: "n1",
          //     type: Query.NodeType.E,
          //     params: {
          //       entityId: "0172df7e-c394-4623-a7d6-cb195c49501e", //Jack London, The Call of the Wild
          //       entityClasses: [],
          //       label: "",
          //       includeSubordinates: true,
          //     },
          //     operator: Query.NodeOperator.And,
          //     edges: [],
          //   },
          // },
          // {
          //   type: Query.EdgeType["R:CLA"],
          //   params: {},
          //   logic: Query.EdgeLogic.Positive,
          //   id: "e2",
          //   node: {
          //     id: "n2",
          //     type: Query.NodeType.E,
          //     params: {
          //       entityId: "cfe8d950-94ed-4d51-b215-0f1ab0416a01", //animal
          //       entityClasses: [],
          //       label: "",
          //       includeSubordinates: true,
          //     },
          //     operator: Query.NodeOperator.And,
          //     edges: [],
          //   },
          // },
        ]
      : [],
};

enum QueryActionType {
  addNode,
  removeEdge,
  updateEdgeType,
  updateEdgeLogic,
  updateEdgePropPair,
  updateEdgeValueNode,
  updateEdgeValueLogic,
  updateNodeType,
  updateNodeClass,
  clearNodeFilters,
  updateNodeFilters,
  updateNodeEntityId,
  updateNodeOperator,
  updateNodeExpansionToggles,
  setQueryState,
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
      type: QueryActionType.updateEdgeLogic;
      payload: { edgeId: string; newLogic: Query.EdgeLogic };
    }
  | {
      type: QueryActionType.updateEdgePropPair;
      payload: { edgeId: string; propPair: Query.IPropPair | undefined };
    }
  | {
      type: QueryActionType.updateEdgeValueNode;
      payload: { edgeId: string; hasValueNode: boolean };
    }
  | {
      type: QueryActionType.updateEdgeValueLogic;
      payload: { edgeId: string; newLogic: Query.EdgeLogic };
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
      type: QueryActionType.clearNodeFilters;
      payload: { nodeId: string };
    }
  | {
      type: QueryActionType.updateNodeFilters;
      payload: { nodeId: string; changes: Partial<Query.INodeParams> };
    }
  | {
      type: QueryActionType.updateNodeEntityId;
      payload: { nodeId: string; newEntityId: string | undefined };
    }
  | {
      type: QueryActionType.updateNodeOperator;
      payload: { nodeId: string; newOperator: Query.NodeOperator };
    }
  | {
      type: QueryActionType.updateNodeExpansionToggles;
      payload: {
        nodeId: string;
        field: "includeEquivalents" | "includeSubordinates";
        value: boolean | undefined;
      };
    }
  | {
      type: QueryActionType.setQueryState;
      payload: { newState: Query.INode };
    };

const queryReducer = (state: Query.INode, action: QueryAction) => {
  switch (action.type) {
    case QueryActionType.addNode:
      return addNode(state, action.payload.parentId);

    case QueryActionType.removeEdge:
      const edgeToRemove = action.payload.edgeId;
      const updatedStateRemove = { ...state };

      const edge = getAllEdges(updatedStateRemove).find((edge) => edge.id === edgeToRemove);
      if (!edge) {
        return updatedStateRemove;
      }
      const parentNode2 = getEdgeSourceNode(updatedStateRemove, edgeToRemove);
      if (!parentNode2) {
        return updatedStateRemove;
      }
      parentNode2.edges = parentNode2.edges.filter((e) => e.id !== edgeToRemove);

      return updatedStateRemove;

    case QueryActionType.updateEdgeType:
      const edgeId = action.payload.edgeId;
      const newType = action.payload.newType;

      const updatedStateUpdate = { ...state };

      const edgeToUpdate = getAllEdges(updatedStateUpdate).find((edge) => edge.id === edgeId);
      if (!edgeToUpdate) {
        return updatedStateUpdate;
      }
      const sourceClassesBeforeSwitch = sourceClassesByEdge(updatedStateUpdate);
      // the propPair pins one half of the prop, so it survives only a switch to
      // an edge that pins the same half
      if (Query.PropPairEdges[edgeToUpdate.type] !== Query.PropPairEdges[newType]) {
        delete edgeToUpdate.params?.propPair;
      }
      edgeToUpdate.type = newType;

      // the child node's params are edge-type specific. On a type switch, drop
      // the params the new edge type does not accept so stale entity filters
      // don't linger. For edges that respect an entityClass, always re-seed the
      // picker's default class - a class carried over from the previous edge
      // type must never survive the switch - so the class filter and its tooltip
      // hint match what the suggester shows immediately on switch. The seed is
      // the first class the suggester offers - for relation edges that depends
      // on the classes the edge's source node can hold, as in QueryGridNode.
      // The suggester never writes its initial class back, so a seed outside
      // its options would filter on a class no relation of the source can reach.
      const newTargetParams = Query.EdgeTypeTargetNodeParams[newType] ?? {};
      if (newTargetParams.entityClass) {
        const allowed: EntityEnums.Class[] = newTargetParams.entityClass.allowedClasses ?? [];
        const relationConstrained = getRelationConstrainedCategoryTypes(
          newType,
          getEdgeSourceClasses(updatedStateUpdate, edgeId),
        );
        const defaultClasses = relationConstrained?.length
          ? relationConstrained
          : allowed.length
            ? allowed
            : classesAll;
        edgeToUpdate.node.params.entityClasses = [defaultClasses[0]];
      } else {
        edgeToUpdate.node.params.entityClasses = undefined;
      }
      if (!newTargetParams.entityId) {
        edgeToUpdate.node.params.entityId = undefined;
      }
      // the value node is optional on HP: / SP: and kept across a switch between them
      if (!Query.TupleValueEdgeTypes[newType]) {
        delete edgeToUpdate.valueNode;
        delete edgeToUpdate.valueLogic;
      }
      reseedRelationTargetClasses(updatedStateUpdate, sourceClassesBeforeSwitch);
      return updatedStateUpdate;

    case QueryActionType.updateEdgeLogic:
      const edgeIdLogic = action.payload.edgeId;
      const newLogic = action.payload.newLogic;

      const updatedStateLogic = { ...state };

      const edgeToUpdateLogic = getAllEdges(updatedStateLogic).find(
        (edge) => edge.id === edgeIdLogic,
      );
      if (!edgeToUpdateLogic) {
        return updatedStateLogic;
      }
      edgeToUpdateLogic.logic = newLogic;
      return updatedStateLogic;

    case QueryActionType.updateEdgePropPair:
      return updateEdgePropPair(state, action.payload.edgeId, action.payload.propPair);

    case QueryActionType.updateEdgeValueNode: {
      const updatedStateValue = { ...state };
      const edgeWithValue = getAllEdges(updatedStateValue).find(
        (edge) => edge.id === action.payload.edgeId,
      );
      if (!edgeWithValue || !Query.TupleValueEdgeTypes[edgeWithValue.type]) {
        return updatedStateValue;
      }
      if (action.payload.hasValueNode) {
        edgeWithValue.valueNode ??= newValueNode();
      } else {
        delete edgeWithValue.valueNode;
        delete edgeWithValue.valueLogic;
      }
      return updatedStateValue;
    }

    case QueryActionType.updateEdgeValueLogic: {
      const updatedStateValueLogic = { ...state };
      const edgeWithValueLogic = getAllEdges(updatedStateValueLogic).find(
        (edge) => edge.id === action.payload.edgeId,
      );
      if (!edgeWithValueLogic?.valueNode) {
        return updatedStateValueLogic;
      }
      edgeWithValueLogic.valueLogic = action.payload.newLogic;
      return updatedStateValueLogic;
    }

    case QueryActionType.updateNodeType:
      return updateNodeType(state, action.payload.nodeId, action.payload.newType);

    case QueryActionType.updateNodeClass:
      return updateNodeClass(state, action.payload.nodeId, action.payload.newEntityClasses);

    case QueryActionType.clearNodeFilters:
      return clearNodeFilters(state, action.payload.nodeId);

    case QueryActionType.updateNodeFilters:
      return updateNodeFilters(state, action.payload.nodeId, action.payload.changes);

    case QueryActionType.updateNodeEntityId:
      return updateNodeEntityId(state, action.payload.nodeId, action.payload.newEntityId);

    case QueryActionType.updateNodeOperator:
      return updateNodeOperator(state, action.payload.nodeId, action.payload.newOperator);

    case QueryActionType.updateNodeExpansionToggles:
      return updateNodeExpansionToggles(
        state,
        action.payload.nodeId,
        action.payload.field,
        action.payload.value,
      );

    case QueryActionType.setQueryState:
      // deep clone so the loaded template (e.g. a saved query object held in
      // the react-query cache) is never mutated by subsequent edits
      return deepCopy(action.payload.newState);

    default:
      return state;
  }
};

const updateEdgePropPair = (
  state: Query.INode,
  edgeId: string,
  propPair: Query.IPropPair | undefined,
): Query.INode => {
  const updatedState = { ...state };

  const edgeToUpdate = getAllEdges(updatedState).find((edge) => edge.id === edgeId);
  if (!edgeToUpdate) {
    return updatedState;
  }
  if (propPair) {
    edgeToUpdate.params = { ...edgeToUpdate.params, propPair };
  } else {
    delete edgeToUpdate.params?.propPair;
  }

  return updatedState;
};

const updateNodeClass = (
  state: Query.INode,
  nodeId: string,
  newEntityClasses: EntityEnums.Class[],
): Query.INode => {
  const updatedState = { ...state };

  const nodeToUpdate = getAllNodes(updatedState).find((node) => node.id === nodeId);
  if (!nodeToUpdate) {
    return updatedState;
  }
  const sourceClassesBefore = sourceClassesByEdge(updatedState);
  nodeToUpdate.params.entityClasses = newEntityClasses;
  reseedRelationTargetClasses(updatedState, sourceClassesBefore);

  return updatedState;
};

// the classes each edge's source node can hold, by edge id
const sourceClassesByEdge = (root: Query.INode): Map<string, string> =>
  new Map(getAllEdges(root).map((edge) => [edge.id, getEdgeSourceClasses(root, edge.id).join()]));

/**
 * Relation edges constrain their target classes by the classes their source
 * node can hold, so a change to a node can leave a target under it filtering
 * on a class the relation no longer reaches. Such a target moves to the first
 * class the relation allows, which is what its class picker offers first.
 * Only a target whose source classes differ from `before` moves: its picker
 * re-seeds the class it shows on that very difference, so the class shown and
 * the class stored stay the same. Sources come before their targets here, so a
 * moved target already counts for the edges under it. Targets with a picked
 * entity, an empty (any-class) filter, or no allowed class at all (its picker
 * is disabled) keep their classes.
 */
const reseedRelationTargetClasses = (root: Query.INode, before: Map<string, string>) => {
  for (const edge of getAllEdges(root)) {
    const sourceClasses = getEdgeSourceClasses(root, edge.id);
    const target = edge.node;
    const currentClasses = target.params.entityClasses ?? [];
    if (
      sourceClasses.join() === before.get(edge.id) ||
      target.params.entityId !== undefined ||
      currentClasses.length === 0
    ) {
      continue;
    }
    const allowed = getRelationConstrainedCategoryTypes(edge.type, sourceClasses);
    if (!allowed?.length || currentClasses.every((cls) => allowed.includes(cls))) {
      continue;
    }
    target.params.entityClasses = [allowed[0]];
  }
};

// every node filter, NODE_FILTER_KEYS
const clearNodeFilters = (state: Query.INode, nodeId: string): Query.INode => {
  const updatedState = { ...state };

  const nodeToUpdate = getAllNodes(updatedState).find((node) => node.id === nodeId);
  if (nodeToUpdate) {
    NODE_FILTER_KEYS.forEach((key) => delete nodeToUpdate.params[key]);
  }

  return updatedState;
};

// an empty value (undefined, "" or []) removes the param
const updateNodeFilters = (
  state: Query.INode,
  nodeId: string,
  changes: Partial<Query.INodeParams>,
): Query.INode => {
  const updatedState = { ...state };

  const nodeToUpdate = getAllNodes(updatedState).find((node) => node.id === nodeId);
  if (!nodeToUpdate) {
    return updatedState;
  }
  const params = nodeToUpdate.params as Record<string, unknown>;
  Object.entries(changes).forEach(([key, value]) => {
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
      delete params[key];
    } else {
      params[key] = value;
    }
  });

  return updatedState;
};

const updateNodeEntityId = (
  state: Query.INode,
  nodeId: string,
  newEntityId: string | undefined,
): Query.INode => {
  const updatedState = { ...state };

  const nodeToUpdate = getAllNodes(updatedState).find((node) => node.id === nodeId);
  if (!nodeToUpdate) {
    return updatedState;
  }
  const sourceClassesBefore = sourceClassesByEdge(updatedState);
  if (newEntityId === undefined) {
    delete nodeToUpdate.params.entityId;
  } else {
    nodeToUpdate.params.entityId = newEntityId;
    nodeToUpdate.params.entityClasses = [];
    // a pinned entity is the node's whole match, so the node filters are hidden
    // while one is set
    NODE_FILTER_KEYS.forEach((key) => delete nodeToUpdate.params[key]);
  }
  reseedRelationTargetClasses(updatedState, sourceClassesBefore);

  return updatedState;
};

const updateNodeOperator = (
  state: Query.INode,
  nodeId: string,
  newOperator: Query.NodeOperator,
): Query.INode => {
  const updatedState = { ...state };

  const nodeToUpdate = getAllNodes(updatedState).find((node) => node.id === nodeId);
  if (!nodeToUpdate) {
    return updatedState;
  }
  nodeToUpdate.operator = newOperator;

  return updatedState;
};

const updateNodeExpansionToggles = (
  state: Query.INode,
  nodeId: string,
  field: "includeEquivalents" | "includeSubordinates",
  value: boolean | undefined,
): Query.INode => {
  const updatedState = { ...state };

  const nodeToUpdate = getAllNodes(updatedState).find((node) => node.id === nodeId);
  if (!nodeToUpdate) {
    return updatedState;
  }

  const sourceClassesBefore = sourceClassesByEdge(updatedState);
  if (value === undefined) {
    delete nodeToUpdate.params[field];
  } else {
    nodeToUpdate.params[field] = value;
  }
  reseedRelationTargetClasses(updatedState, sourceClassesBefore);

  return updatedState;
};

const updateNodeType = (
  state: Query.INode,
  nodeId: string,
  newType: Query.NodeType,
): Query.INode => {
  const updatedState = { ...state };

  const nodeToUpdate = getAllNodes(updatedState).find((node) => node.id === nodeId);
  if (!nodeToUpdate) {
    return updatedState;
  }
  nodeToUpdate.type = newType;

  return updatedState;
};

const newNode = (entityClasses: EntityEnums.Class[]): Query.INode => ({
  type: Query.NodeType.E,
  id: uuidv4(),
  // EQ and SUB start on for every node added in the builder; they widen a
  // picked entity only, so they stay inert until one is picked
  params: { entityClasses, label: "", includeEquivalents: true, includeSubordinates: true },
  operator: Query.NodeOperator.And,
  edges: [],
});

/** The value node of an HP: / SP: edge, with no class, so left untouched it matches any value */
const newValueNode = (): Query.INode => newNode([]);

const addNode = (state: Query.INode, parentId: string): Query.INode => {
  const newEdge: Query.IEdge = {
    type: Query.EdgeType["HP:"],
    id: uuidv4(),
    params: {},
    logic: Query.EdgeLogic.Positive,
    node: newNode([]),
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
        ...(edge.valueNode && { valueNode: cloneNode(edge.valueNode) }),
      })),
    };
  };

  return cloneNode(state);
};

const queryDiff = (state1: Query.INode, state2: Query.INode) => {
  return false;
};

export { QueryAction, QueryActionType, queryDiff, queryReducer, queryStateInitial };

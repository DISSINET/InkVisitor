import { Query } from "@shared/types";

export const getAllEdges = (node: Query.INode): Query.IEdge[] => {
  const edges: Query.IEdge[] = [];
  const traverse = (node: Query.INode) => {
    node.edges.forEach((edge) => {
      edges.push(edge);
      traverse(edge.node);
    });
  };
  traverse(node);
  return edges;
};

export const getAllNodes = (node: Query.INode): Query.INode[] => {
  const nodes: Query.INode[] = [];
  const traverse = (node: Query.INode) => {
    nodes.push(node);
    node.edges.forEach((edge) => {
      traverse(edge.node);
    });
  };
  traverse(node);
  return nodes;
};

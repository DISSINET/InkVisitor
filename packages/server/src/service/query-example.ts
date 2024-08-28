import { EntityEnums } from "@shared/enums";
import { Query } from "@shared/types";

const exampleSearch: Search.INode = {
  type: Search.NodeType.X,
  params: { classes: [EntityEnums.Class.Object] },
  operator: Search.NodeOperator.And,
  edges: [
    // first condition - classification with superclass fruit
    {
      type: Search.EdgeType.XHasClassification,
      logic: Search.EdgeLogic.Positive,
      params: {},
      node: {
        type: Search.NodeType.C,
        params: { classes: [EntityEnums.Class.Concept] },
        operator: Search.NodeOperator.And,
        edges: [
          {
            type: Search.EdgeType.XHasSuperclass,
            logic: Search.EdgeLogic.Positive,
            params: {},
            node: {
              type: Search.NodeType.C,
              params: { classes: [EntityEnums.Class.Concept], label: "fruit" },
              operator: Search.NodeOperator.And,
              edges: [],
            },
          },
        ],
      },
    },

    // second condition - appears in a S under a specific T
    {
      type: Search.EdgeType.XIsActantInS,
      logic: Search.EdgeLogic.Positive,
      params: {},
      node: {
        type: Search.NodeType.S,
        params: { classes: [EntityEnums.Class.Statement] },
        operator: Search.NodeOperator.And,
        edges: [
          {
            type: Search.EdgeType.SIsInT,
            logic: Search.EdgeLogic.Positive,
            params: {},
            node: {
              type: Search.NodeType.T,
              params: { classes: [EntityEnums.Class.Territory], id: "XY" },
              operator: Search.NodeOperator.And,
              edges: [],
            },
          },
        ],
      },
    },
  ],
};

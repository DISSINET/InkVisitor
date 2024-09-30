import { EntityEnums } from "@shared/enums";
import { Query } from "@shared/types";

const exampleQuery: Query.INode = {
  type: Query.NodeType.E,
  params: { classes: [EntityEnums.Class.Object] },
  operator: Query.NodeOperator.And,
  id: "n1",
  edges: [
    // first condition - classification with superclass fruit
    {
      id: "e1",
      type: Query.EdgeType["R:CLA"],
      logic: Query.EdgeLogic.Positive,
      params: {},
      node: {
        id: "n2",
        type: Query.NodeType.E,
        params: { classes: [EntityEnums.Class.Concept] },
        operator: Query.NodeOperator.And,
        edges: [
          {
            id: "e2",
            type: Query.EdgeType["R:SCL"],
            logic: Query.EdgeLogic.Positive,
            params: {},
            node: {
              id: "n3",
              type: Query.NodeType.E,
              params: { classes: [EntityEnums.Class.Concept], label: "fruit" },
              operator: Query.NodeOperator.And,
              edges: [],
            },
          },
        ],
      },
    },

    // second condition - appears in a S under a specific T
    {
      type: Query.EdgeType["IS:"],
      logic: Query.EdgeLogic.Positive,
      params: {},
      id: "e3",
      node: {
        id: "n4",
        type: Query.NodeType.E,
        params: { classes: [EntityEnums.Class.Statement] },
        operator: Query.NodeOperator.And,
        edges: [
          {
            id: "e4",
            type: Query.EdgeType["SUT:D"],
            logic: Query.EdgeLogic.Positive,
            params: {},
            node: {
              id: "n5",
              type: Query.NodeType.E,
              params: { classes: [EntityEnums.Class.Territory], id: "XY" },
              operator: Query.NodeOperator.And,
              edges: [],
            },
          },
        ],
      },
    },
  ],
};

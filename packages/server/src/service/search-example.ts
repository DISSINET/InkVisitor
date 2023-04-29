import { EntityEnums } from "@shared/enums";
import { Search } from "@shared/types";

const exampleSearch: Search.ISearchNode = {
  type: Search.SearchNodeType.X,
  params: { classes: [EntityEnums.Class.Object] },
  operator: Search.SearchNodeOperator.And,
  edges: [
    // first condition - classification with superclass fruit
    {
      type: Search.SearchEdgeType.XHasClassification,
      logic: Search.SearchEdgeLogic.Positive,
      params: {},
      node: {
        type: Search.SearchNodeType.C,
        params: { classes: [EntityEnums.Class.Concept] },
        operator: Search.SearchNodeOperator.And,
        edges: [
          {
            type: Search.SearchEdgeType.XHasSuperclass,
            logic: Search.SearchEdgeLogic.Positive,
            params: {},
            node: {
              type: Search.SearchNodeType.C,
              params: { classes: [EntityEnums.Class.Concept], label: "fruit" },
              operator: Search.SearchNodeOperator.And,
              edges: [],
            },
          },
        ],
      },
    },

    // second condition - appears in a S under a specific T
    {
      type: Search.SearchEdgeType.XIsActantInS,
      logic: Search.SearchEdgeLogic.Positive,
      params: {},
      node: {
        type: Search.SearchNodeType.S,
        params: { classes: [EntityEnums.Class.Statement] },
        operator: Search.SearchNodeOperator.And,
        edges: [
          {
            type: Search.SearchEdgeType.SIsInT,
            logic: Search.SearchEdgeLogic.Positive,
            params: {},
            node: {
              type: Search.SearchNodeType.T,
              params: { classes: [EntityEnums.Class.Territory], id: "XY" },
              operator: Search.SearchNodeOperator.And,
              edges: [],
            },
          },
        ],
      },
    },
  ],
};

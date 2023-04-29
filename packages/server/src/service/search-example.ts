import { EntityEnums } from "@shared/enums";

const { Search } = require("@shared/types");

const exampleSearch: typeof Search.ISearchNode = {
  type: Search.SearchNodeType.X,
  params: { class: EntityEnums.Class.Object },
  operator: Search.SearchNodeOperator.And,
  edges: [
    // first condition - classification with superclass fruit
    {
      type: Search.SearchEdgeType.XHasClassification,
      logic: Search.SearchEdgeLogic.Positive,
      node: {
        type: Search.SearchEdgeType.C,
        params: { class: EntityEnums.Class.Concept },
        operator: Search.SearchNodeOperator.And,
        edges: [
          {
            type: Search.SearchEdgeType.XHasSuperclass,
            logic: Search.SearchEdgeLogic.Positive,
            node: {
              type: Search.SearchEdgeType.C,
              params: { class: EntityEnums.Class.Concept, label: "fruit" },
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
      node: {
        type: Search.SearchEdgeType.S,
        params: { class: EntityEnums.Class.Statement },
        operator: Search.SearchNodeOperator.And,
        edges: [
          {
            type: Search.SearchEdgeType.SIsInT,
            logic: Search.SearchEdgeLogic.Positive,
            node: {
              type: Search.SearchEdgeType.T,
              params: { class: EntityEnums.Class.Territory, id: "XY" },
              operator: Search.SearchNodeOperator.And,
              edges: [],
            },
          },
        ],
      },
    },
  ],
};

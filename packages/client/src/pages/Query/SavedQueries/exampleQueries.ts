import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { ISavedQueryData, Query } from "@inkvisitor/shared/types";

export interface IExampleQuery {
  id: string;
  name: string;
  data: ISavedQueryData;
}

// Placeholder examples — to be replaced with the real curated list.
export const EXAMPLE_QUERIES: IExampleQuery[] = [
  {
    id: "example-animals-under-T",
    name: "Animals under the Territory",
    data: {
      query: {
        id: "root",
        type: Query.NodeType.E,
        params: { entityClasses: [EntityEnums.Class.Being] },
        operator: Query.NodeOperator.And,
        edges: [
          {
            type: Query.EdgeType["EUT:"],
            params: {},
            logic: Query.EdgeLogic.Positive,
            id: "e1",
            node: {
              id: "n1",
              type: Query.NodeType.E,
              params: {
                entityId: "0172df7e-c394-4623-a7d6-cb195c49501e", //Jack London, The Call of the Wild
                entityClasses: [],
                label: "",
                includeSubordinates: true,
              },
              operator: Query.NodeOperator.And,
              edges: [],
            },
          },
          {
            type: Query.EdgeType["R:CLA"],
            params: {},
            logic: Query.EdgeLogic.Positive,
            id: "e2",
            node: {
              id: "n2",
              type: Query.NodeType.E,
              params: {
                entityId: "cfe8d950-94ed-4d51-b215-0f1ab0416a01", //animal
                entityClasses: [],
                label: "",
                includeSubordinates: true,
              },
              operator: Query.NodeOperator.And,
              edges: [],
            },
          },
        ],
      },
      includeEquivalents: true,
      includeSubordinates: true,
    },
  },
  {
    id: "example-entities-used-under-T",
    name: "All entities used in statements under a Territory: Acta Sancti",
    data: {
      query: {
        id: "root",
        type: Query.NodeType.E,
        params: { entityClasses: classesAll },
        operator: Query.NodeOperator.And,
        edges: [
          {
            type: Query.EdgeType["EUT:"],
            params: {},
            logic: Query.EdgeLogic.Positive,
            id: "e1",
            node: {
              id: "n1",
              type: Query.NodeType.E,
              params: {
                entityId: "8bcbfeef-f973-4315-be40-d88f0edef980",
                entityClasses: [],
                label: "",
                includeSubordinates: true,
              },
              operator: Query.NodeOperator.And,
              edges: [],
            },
          },
        ],
      },
      includeEquivalents: false,
      includeSubordinates: true,
    },
  },
];

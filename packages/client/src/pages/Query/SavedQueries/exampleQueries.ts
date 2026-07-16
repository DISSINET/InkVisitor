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
];

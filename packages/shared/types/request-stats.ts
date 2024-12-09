import { EntityEnums, RelationEnums } from "../enums";

import { TimeUnit, Aggregation, EventType } from "./stats";

export interface IRequestStats {
  fromDate: number;
  toDate: number;
  timeUnit: TimeUnit;
  eventType: EventType;
  aggregateBy: Aggregation;
  filter: {
    userIds: string[] | "all";
    editActivities: {
      // relevant only for the edit function
      entities: boolean; // handling entities
      relationsMeta: boolean; // relations inside entities
      relationsStatement: boolean; // in-statment relations
      propsMeta: boolean; // properties inside entities
      propsStatement: boolean; // in-statement properties
      references: boolean; // references for statements and entities
      tags: boolean; // tags for statements and entities
    };
    entityTypes: EntityEnums.Class[] | "all"; // what entities are involved
    relationTypes: RelationEnums.Type[] | "all"; // what relations are involved - valid for edit
  };
}

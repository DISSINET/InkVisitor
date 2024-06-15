import { EntityEnums, RelationEnums } from "../enums";

import { TimeUnit, Aggregation, EventType } from "./stats";

export interface IRequestStats {
  fromDate: number;
  toDate: number;
  timeUnit: TimeUnit;
  eventType: EventType;
  aggregateBy: Aggregation;
  activities: {
    entities: boolean;
    relationsMeta: boolean;
    relationsStatement: boolean;
    PropsMeta: boolean;
    PropsStatement: boolean;
    References: boolean;
    Tags: boolean;
  };
  filter: {
    userIds: string[] | "all";
    entityTypes: EntityEnums.Class[] | "all";
    relationTypes: RelationEnums.Type[] | "all";
  };
}

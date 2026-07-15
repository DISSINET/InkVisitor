import { Query } from "./query";

export interface ISavedQueryData {
  query: Query.INode; // full recursive tree — each node carries its edges
  includeEquivalents: boolean;
  includeSubordinates: boolean;
}

export interface ISavedQuery {
  id: string;
  name: string;
  ownerId: string; // user id, set server-side from the authenticated user
  shared: boolean; // false = private to owner, true = visible to all users
  data: ISavedQueryData;
  createdAt: Date;
  updatedAt?: Date;
}

// POST /saved-queries payload
export type ISavedQueryCreate = Pick<ISavedQuery, "name" | "shared" | "data">;

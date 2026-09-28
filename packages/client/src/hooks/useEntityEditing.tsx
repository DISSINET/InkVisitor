import { IEntity, IResponseGeneric, Relation } from "@inkvisitor/shared/types";
import { AxiosResponse } from "axios";
import { createContext, useContext } from "react";

/**
 * Every write Detail makes to the entity it shows and to its relations. Detail
 * calls these without knowing where they land: the database, or the drafts of
 * the JSON import. Each implementation refreshes what its writes change.
 */
export interface EntityWrites {
  updateEntity: (
    entity: IEntity,
    changes: Partial<IEntity>
  ) => Promise<AxiosResponse<IResponseGeneric>>;
  createRelation: (relation: Relation.IRelation) => Promise<AxiosResponse<IResponseGeneric>>;
  updateRelation: (
    relationId: string,
    changes: Partial<Relation.IRelation>
  ) => Promise<AxiosResponse<IResponseGeneric>>;
  deleteRelation: (relationId: string) => Promise<AxiosResponse<IResponseGeneric>>;
  // puts a relation at `index` among `siblings`, the relations of its type
  // shown in Detail in their current order
  moveRelation: (
    siblings: Relation.IRelation[],
    relationId: string,
    index: number
  ) => Promise<AxiosResponse<IResponseGeneric>>;
  // adds `memberId` to the synonym group of `entity` (its own group is
  // `ownGroup`, when it has one)
  joinSynonymGroup: (
    entity: IEntity,
    memberId: string,
    ownGroup?: Relation.IRelation
  ) => Promise<AxiosResponse<IResponseGeneric>>;
}

/**
 * What editing an entity means where Detail and the components inside it are
 * rendered. The default is the database; the JSON import sets its own around
 * the Detail of its drafts, which do not exist in the database yet.
 */
export interface EntityEditing {
  // absent: Detail writes to the database
  writes?: EntityWrites;
  // entities not stored yet: their tags have no tooltip to fetch and nothing
  // to drag or act on from a menu
  unstoredEntityIds: Set<string>;
  // suggesters and drop zones may create entities (new ones, copies of a
  // dropped Value, template instances), which writes to the database at once
  createsEntities: boolean;
  // Detail offers what exists only for a stored entity or acts on the database
  // on its own: delete, duplicate, templates, linked document, validation
  // rules, usages, audits; a double click opens an entity in the Detail box
  offersStoredEntityFeatures: boolean;
  // Detail shown outside the Detail box: the element whose width decides its
  // narrow layout, and its tabs sit outside its own height
  hostElementId?: string;
}

export const STORED_ENTITY_EDITING: EntityEditing = {
  unstoredEntityIds: new Set(),
  createsEntities: true,
  offersStoredEntityFeatures: true,
};

export const EntityEditingContext = createContext<EntityEditing>(STORED_ENTITY_EDITING);

export const useEntityEditing = () => useContext(EntityEditingContext);

/** The writes Detail uses, set by Detail around its content. */
export const EntityWritesContext = createContext<EntityWrites | null>(null);

export const useEntityWrites = (): EntityWrites => {
  const writes = useContext(EntityWritesContext);
  if (!writes) {
    throw new Error("useEntityWrites is used outside of Detail");
  }
  return writes;
};

/** What the api answers a write with, for writes that do not reach it. */
export const LOCAL_WRITE_RESPONSE = { data: { result: true } } as AxiosResponse<IResponseGeneric>;

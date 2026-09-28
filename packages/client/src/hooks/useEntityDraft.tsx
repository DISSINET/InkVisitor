import { IEntity, IResponseGeneric, Relation } from "@inkvisitor/shared/types";
import { AxiosResponse } from "axios";
import { createContext, useContext } from "react";

/**
 * Set around Detail when it edits an entity that does not exist in the
 * database yet (the JSON import). Detail and the components inside it write
 * through these callbacks instead of the api, and leave out whatever would
 * write to the database on its own (creating entities from a suggester,
 * instantiating templates) or needs a stored entity (usages, audits).
 */
export interface EntityDraft {
  // entities that exist only as drafts: their tags have nothing to fetch or open
  draftEntityIds: Set<string>;
  updateEntity: (entityId: string, changes: Partial<IEntity>) => void;
  createRelation: (relation: Relation.IRelation) => void;
  updateRelation: (relationId: string, changes: Partial<Relation.IRelation>) => void;
  deleteRelation: (relationId: string) => void;
  // puts these relations in this order; a draft orders relations by position
  reorderRelations: (orderedIds: string[]) => void;
  // element whose width decides Detail's narrow layout
  widthElementId: string;
}

export const EntityDraftContext = createContext<EntityDraft | null>(null);

/** The draft Detail is editing, or null for a stored entity. */
export const useEntityDraft = () => useContext(EntityDraftContext);

/** What the api answers a write with, for the writes a draft settles locally. */
export const DRAFT_WRITE_RESPONSE = { data: { result: true } } as AxiosResponse<IResponseGeneric>;

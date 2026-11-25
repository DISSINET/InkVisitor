import { EntityEnums, RelationEnums } from "../enums";

/**
 * One attribute rewrite in a batch: entities whose current value is `from` get
 * `to`. `from: null` matches any current value; the empty string of each enum
 * is the "missing" value, so it is expressed like any other source value.
 */
export interface IBatchAttributeChange<T> {
  from: T | null;
  to: T;
}

export type IBatchSetAttributeChanges =
  | ({
      attribute: "language";
    } & IBatchAttributeChange<EntityEnums.Language>)
  | {
      attribute: "pos";
      /** applied to Concept entities only */
      concept?: IBatchAttributeChange<EntityEnums.ConceptPartOfSpeech>;
      /** applied to Action entities only; A has no empty pos value, so only
       * the source side can name the missing one */
      action?: {
        from: EntityEnums.ActionPartOfSpeech | "" | null;
        to: EntityEnums.ActionPartOfSpeech;
      };
    };

export interface IRequestBatchReplaceRelation {
  entityIds: string[];
  relationType: RelationEnums.Type;
  /** X: the entity the selected rows are related to */
  fromEntityId: string;
  /** Y: the entity they are related to afterwards */
  toEntityId: string;
  /** decide and count, write nothing */
  dryRun?: boolean;
}

/**
 * Answer of every batch replace route, for a dry run and a save alike.
 * Counts are entities unless named items.
 * selected = unmatched + changed + skipped + failed.
 */
export interface IResponseBatchReplace {
  result: boolean; // changed > 0
  selected: number; // entities found among entityIds, each once
  unmatched: number; // no X: left alone
  changed: number; // X replaced (or would be)
  merged: number; // part of changed: an X item went because Y was there
  skipped: number; // metaprops only
  failed: number; // matched but not changed; the reasons are in errors
  items: number; // X items rewritten or dropped; X held twice counts 2
  nested: number; // metaprops only
  errors: Record<string, string>; // entity id -> reason
}

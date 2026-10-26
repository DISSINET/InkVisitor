import { EntityEnums } from "../enums";

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

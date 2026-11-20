import { EntityEnums } from "@inkvisitor/shared/enums";

// statements and territories carry the labelling language rather than the source's,
// so their language says nothing about how close the anchor is to the text
const CLASSES_WITHOUT_LANGUAGE_CHECK = [EntityEnums.Class.Statement, EntityEnums.Class.Territory];

/**
 * An entity whose language differs from the user's source language (`defaultStatementLanguage`)
 * gets an inferential anchor instead of a textual one, same as an actant or action in a statement.
 */
export const isForeignLanguageEntity = (
  entity: { class: EntityEnums.Class; language: EntityEnums.Language },
  sourceLanguage: EntityEnums.Language | undefined,
): boolean =>
  !!sourceLanguage &&
  !CLASSES_WITHOUT_LANGUAGE_CHECK.includes(entity.class) &&
  entity.language !== sourceLanguage;

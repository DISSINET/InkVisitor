import {
  actantLogicalTypeDict,
  actionPartOfSpeechDict,
  conceptPartOfSpeechDict,
  entityStatusDict,
} from "@inkvisitor/shared/dictionaries";
import { EntityEnums } from "@inkvisitor/shared/enums";

export const statusFilterOptions = entityStatusDict.map((status) => ({
  value: status.value,
  label: status.label,
}));

// the dictionary types its values as plain strings
export const logicalTypeFilterOptions = actantLogicalTypeDict as {
  value: EntityEnums.LogicalType;
  label: string;
}[];

// a concept without a part of speech stores the empty value, which the dictionary leaves
// unlabelled; entities of other classes have no part of speech field, so "none" never matches them
export const partOfSpeechFilterOptions = [
  ...conceptPartOfSpeechDict.map((option) =>
    option.value === EntityEnums.ConceptPartOfSpeech.Empty
      ? { ...option, label: "none" }
      : option,
  ),
  ...actionPartOfSpeechDict,
];

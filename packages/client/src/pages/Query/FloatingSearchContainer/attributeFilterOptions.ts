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

// a concept without a part of speech stores the empty value, which has no label to pick it by
export const partOfSpeechFilterOptions = [
  ...conceptPartOfSpeechDict.filter(
    (option) => option.value !== EntityEnums.ConceptPartOfSpeech.Empty,
  ),
  ...actionPartOfSpeechDict,
];

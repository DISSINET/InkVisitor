import { EntityEnums } from "../enums";

export const conceptPartOfSpeechDict = [
  { value: EntityEnums.ConceptPartOfSpeech.Empty, label: "", info: "" },
  { value: EntityEnums.ConceptPartOfSpeech.Noun, label: "noun", info: "" },
  { value: EntityEnums.ConceptPartOfSpeech.Adj, label: "adjective", info: "" },
  { value: EntityEnums.ConceptPartOfSpeech.Pron, label: "pronoun", info: "" },
  { value: EntityEnums.ConceptPartOfSpeech.Adv, label: "adverb", info: "" },
  { value: EntityEnums.ConceptPartOfSpeech.Num, label: "numeral", info: "" },
  {
    value: EntityEnums.ConceptPartOfSpeech.Adp,
    label: "adposition",
    info: "",
  },
  {
    value: EntityEnums.ConceptPartOfSpeech.CConj,
    label: "coordinating conjunction",
    info: "",
  },
  {
    value: EntityEnums.ConceptPartOfSpeech.SConj,
    label: "subordinating conjunction",
    info: "",
  },
  {
    value: EntityEnums.ConceptPartOfSpeech.Det,
    label: "determiner",
    info: "",
  },
  {
    value: EntityEnums.ConceptPartOfSpeech.Intj,
    label: "interjection",
    info: "",
  },
  { value: EntityEnums.ConceptPartOfSpeech.Part, label: "particle", info: "" },
];

export const actionPartOfSpeechDict = [
  { value: EntityEnums.ActionPartOfSpeech.Verb, label: "verb", info: "" },
];

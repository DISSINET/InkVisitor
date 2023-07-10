import { EntityEnums } from "../enums";

export const conceptPartOfSpeechDict = [
  { value: EntityEnums.ConceptPartOfSpeech.Empty, label: "", infos: "" },
  { value: EntityEnums.ConceptPartOfSpeech.Noun, label: "noun", infos: "" },
  { value: EntityEnums.ConceptPartOfSpeech.Adj, label: "adjective", infos: "" },
  { value: EntityEnums.ConceptPartOfSpeech.Pron, label: "pronoun", infos: "" },
  { value: EntityEnums.ConceptPartOfSpeech.Adv, label: "adverb", infos: "" },
  { value: EntityEnums.ConceptPartOfSpeech.Num, label: "numeral", infos: "" },
  {
    value: EntityEnums.ConceptPartOfSpeech.Adp,
    label: "adposition",
    infos: "",
  },
  {
    value: EntityEnums.ConceptPartOfSpeech.CConj,
    label: "coordinating conjunction",
    infos: "",
  },
  {
    value: EntityEnums.ConceptPartOfSpeech.SConj,
    label: "subordinating conjunction",
    infos: "",
  },
  {
    value: EntityEnums.ConceptPartOfSpeech.Det,
    label: "determiner",
    infos: "",
  },
  {
    value: EntityEnums.ConceptPartOfSpeech.Intj,
    label: "interjection",
    infos: "",
  },
  { value: EntityEnums.ConceptPartOfSpeech.Part, label: "particle", infos: "" },
];

export const actionPartOfSpeechDict = [
  { value: EntityEnums.ActionPartOfSpeech.Verb, label: "verb", infos: "" },
];

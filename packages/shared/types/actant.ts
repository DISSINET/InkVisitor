import { IProp } from ".";
import { ActantType, ActantStatus, Language, Certainty, Elvl, Logic, Mood, MoodVariant, Operator, Partitivity, Virtuality } from "../enums";

export interface IActant {
  id: string;
  class: ActantType;
  data: any;
  label: string;
  detail: string;
  status: ActantStatus;
  language: Language;
  notes: string[];
  props: IProp[]
}
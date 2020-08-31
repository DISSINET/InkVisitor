export interface Action {
  id: string;
  parent: false | string;
  note: string;
  labels: { label: string; language: string }[];
  types: [];
  valencies: [];
  rulesActants: [];
  rulesProperties: [];
}

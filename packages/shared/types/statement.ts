import { IActant, IProp, ILabel } from "./";

export interface IStatement extends IActant {
  class: "S";
  data: {
    action: string;
    certainty: string;
    elvl: string;
    modality: string;
    text: string;
    note: string;
    territory: {
      id: string;
      order: number;
    };
    actants: IStatementActant[];
    props: IProp[]; // this
    references: IStatementReference[];
    tags: string[]; // ids of IActant
  };
}

export interface IStatementActant {
  id: string;
  actant: string; //  this
  position: string;
  modality: string;
  elvl: string;
  certainty: string;
}

export interface IStatementReference {
  id: string;
  resource: string;
  part: string;
  type: string;
}

export function getActantIdsFromStatements(statements: IStatement[]): string[] {
  const actantIds: Record<string, null> = {}; // unique check

  for (const statement of statements) {
    statement.data.actants.forEach((a) => (actantIds[a.actant] = null));
    statement.data.tags.forEach((t) => (actantIds[t] = null));
    statement.data.props.forEach((p) => {
      actantIds[p.value.id] = null;
      actantIds[p.type.id] = null;
      actantIds[p.origin] = null;
    });
  }

  return Object.keys(actantIds);
}

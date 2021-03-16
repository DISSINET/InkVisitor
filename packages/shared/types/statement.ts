import { IActant, IProp, ILabel } from "./";

export interface IStatement extends IActant {
  class: "S";
  data: {
    action: string;
    territory: {
      id: string;
      order: number;
    };
    //labels: ILabel[];
    references: {
      id: string;
      resource: string;
      part: string;
      type: string;
    }[];
    tags: string[]; // ids of IActant
    certainty: string;
    elvl: string;
    modality: string;
    text: string;
    note: string;
    props: IProp[];
    actants: {
      id: string;
      actant: string;
      position: string;
      elvl: string;
      certainty: string;
    }[];
  };
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

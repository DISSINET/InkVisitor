import "ts-jest";
import { IEntity, IProp } from "@inkvisitor/shared/types";
import {
  collectSubPropEntityIds,
  groupSubPropsByValue,
  resolveSubProps,
} from "./explore-subprops";

const prop = (typeId: string, valueId: string, children: IProp[] = []): IProp =>
  ({
    id: `${typeId}-${valueId}`,
    type: { entityId: typeId },
    value: { entityId: valueId },
    children,
  }) as IProp;

const entity = (id: string): IEntity => ({ id, labels: [id] }) as IEntity;

describe("explore-subprops", () => {
  const distance = prop("distance", "206");
  const precision = prop("precision", "10m", [prop("unit", "metre")]);

  it("groupSubPropsByValue keeps only props of the type that have subproperties", () => {
    const props = [
      prop("related", "praha", [distance]),
      prop("related", "vienna"),
      prop("coordinates", "49N", [precision]),
    ];
    expect(groupSubPropsByValue(props, "related")).toEqual({ praha: [distance] });
  });

  it("groupSubPropsByValue merges subproperties of props sharing a value", () => {
    const other = prop("note", "x");
    const props = [prop("related", "praha", [distance]), prop("related", "praha", [other])];
    expect(groupSubPropsByValue(props, "related")).toEqual({ praha: [distance, other] });
  });

  it("collectSubPropEntityIds walks nested subproperties", () => {
    expect(collectSubPropEntityIds([distance, precision])).toEqual([
      "distance",
      "206",
      "precision",
      "10m",
      "unit",
      "metre",
    ]);
  });

  it("resolveSubProps maps ids to entities and drops subproperties with nothing to show", () => {
    const byId = {
      precision: entity("precision"),
      "10m": entity("10m"),
      metre: entity("metre"),
    };
    expect(resolveSubProps([precision, distance], byId)).toEqual([
      {
        type: byId.precision,
        value: byId["10m"],
        children: [{ type: undefined, value: byId.metre, children: [] }],
      },
    ]);
  });
});

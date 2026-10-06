import "ts-jest";
import { IEntity, IProp } from "@inkvisitor/shared/types";
import {
  collectSubPropEntityIds,
  groupPropsWithSubPropsByType,
  groupSubPropsByValue,
  resolvePropsUnderType,
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

describe("explore-subprops for property type columns", () => {
  const distance = prop("distance", "206");

  it("groupPropsWithSubPropsByType keeps every prop of a type where one has subproperties", () => {
    const withDistance = prop("related", "praha", [distance]);
    const plain = prop("related", "vienna");
    const props = [withDistance, plain, prop("status", "alive")];
    expect(groupPropsWithSubPropsByType(props)).toEqual({ related: [withDistance, plain] });
  });

  it("resolvePropsUnderType turns each prop into its value with its subproperties", () => {
    const byId = {
      praha: entity("praha"),
      vienna: entity("vienna"),
      distance: entity("distance"),
      "206": entity("206"),
    };
    const props = [prop("related", "praha", [distance]), prop("related", "vienna")];
    expect(resolvePropsUnderType(props, byId)).toEqual([
      {
        value: byId.praha,
        children: [{ type: byId.distance, value: byId["206"], children: [] }],
      },
      { value: byId.vienna, children: [] },
    ]);
  });
});

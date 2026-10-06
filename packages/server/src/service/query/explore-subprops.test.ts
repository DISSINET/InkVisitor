import "ts-jest";
import { IEntity, IProp } from "@inkvisitor/shared/types";
import {
  collectSubPropEntityIds,
  groupPropsByType,
  groupPropsByValue,
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

  describe("groupPropsByValue", () => {
    it("keeps every prop of the type, by value, once one has subproperties", () => {
      const praha = prop("related", "praha", [distance]);
      const vienna = prop("related", "vienna");
      const props = [praha, vienna, prop("coordinates", "49N", [precision])];
      expect(groupPropsByValue(props, "related")).toEqual({
        praha: [praha],
        vienna: [vienna],
      });
    });

    it("keeps props sharing a value apart", () => {
      const first = prop("related", "praha", [distance]);
      const second = prop("related", "praha");
      expect(groupPropsByValue([first, second], "related")).toEqual({ praha: [first, second] });
    });

    it("is empty when no prop of the type has subproperties", () => {
      const props = [prop("related", "praha"), prop("coordinates", "49N", [precision])];
      expect(groupPropsByValue(props, "related")).toEqual({});
    });
  });

  describe("groupPropsByType", () => {
    it("keeps every prop, by type, once one has subproperties", () => {
      const praha = prop("related", "praha", [distance]);
      const vienna = prop("related", "vienna");
      const alive = prop("status", "alive");
      expect(groupPropsByType([praha, vienna, alive])).toEqual({
        related: [praha, vienna],
        status: [alive],
      });
    });

    it("is empty when no prop has subproperties", () => {
      expect(groupPropsByType([prop("related", "praha"), prop("status", "alive")])).toEqual({});
    });
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

  it("resolveSubProps maps ids to entities and drops props with nothing to show", () => {
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

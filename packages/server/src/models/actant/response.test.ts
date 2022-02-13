import "ts-jest";
import { Db } from "@service/RethinkDB";
import Actant from "./actant";
import Statement from "@models/statement/statement";
import { clean } from "@modules/common.test";
import { findActantById } from "@service/shorthands";
import { IActant, IProp, IStatement } from "@shared/types";
import { ResponseActantDetail } from "./response";
import { ActantType, UsedInPosition } from "@shared/enums";
import Prop, { PropSpec } from "@models/prop/prop";

describe("test ResponseActantDetail.walkPropsStatements", function () {
  const baseActant = new Actant({ id: "1" });
  const childActant = new Actant({ id: "2" });
  const linkedActant = new Actant({
    id: "3",
  });
  const prop = new Prop({});
  prop.type = new PropSpec({});
  prop.type.id = baseActant.id;
  prop.value = new PropSpec({});
  prop.value.id = baseActant.id;

  const children = new Prop({});
  children.type = new PropSpec({});
  children.type.id = childActant.id;
  children.value = new PropSpec({});
  children.value.id = childActant.id;

  prop.children.push(children);
  linkedActant.props.push(prop);

  describe("linked entry via prop.type & prop.value and another in child with the same setup", () => {
    const response = new ResponseActantDetail(baseActant);
    response.walkPropsStatements(linkedActant, linkedActant.props);

    it("should correctly add from prop.type", () => {
      const foundInPropType = response.usedInMetaProps.find(
        (u) =>
          u.entityId === linkedActant.id && u.position === UsedInPosition.Type
      );
      expect(!!foundInPropType).toBeTruthy();
    });

    it("should correctly add from prop.value", () => {
      const foundInValueType = response.usedInMetaProps.find(
        (u) =>
          u.entityId === linkedActant.id && u.position === UsedInPosition.Value
      );
      expect(!!foundInValueType).toBeTruthy();
    });
  });

  describe("linked entry via prop.children[].type & prop.children[].value", () => {
    const response = new ResponseActantDetail(childActant);
    response.walkPropsStatements(linkedActant, linkedActant.props);

    it("should correctly add from prop.children[].type", () => {
      const foundInPropType = response.usedInMetaProps.find(
        (u) =>
          u.entityId === linkedActant.id && u.position === UsedInPosition.Type
      );
      expect(!!foundInPropType).toBeTruthy();
    });

    it("should correctly add from prop.children[].value", () => {
      const foundInValueType = response.usedInMetaProps.find(
        (u) =>
          u.entityId === linkedActant.id && u.position === UsedInPosition.Value
      );
      expect(!!foundInValueType).toBeTruthy();
    });
  });
});

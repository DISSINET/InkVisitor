import "ts-jest";
import { Db } from "@service/RethinkDB";
import Actant from "./actant";
import Statement, {
  StatementActant,
  StatementAction,
} from "@models/statement/statement";
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
    class: ActantType.Statement,
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

    it("should add to usedInMetaProps from prop.type", () => {
      const foundInType = response.usedInMetaProps.find(
        (u) =>
          u.entityId === linkedActant.id && u.position === UsedInPosition.Type
      );
      expect(!!foundInType).toBeTruthy();
    });

    it("should add to usedInMetaProps from prop.value", () => {
      const foundInValue = response.usedInMetaProps.find(
        (u) =>
          u.entityId === linkedActant.id && u.position === UsedInPosition.Value
      );
      expect(!!foundInValue).toBeTruthy();
    });

    it("should add to entities map", () => {
      expect(!!response.entities[linkedActant.id]).toBeTruthy();
    });

    it("should add to usedInStatementProps from prop.type", () => {
      const foundInType = response.usedInStatementProps.find(
        (u) =>
          u.statement.id === linkedActant.id &&
          u.position === UsedInPosition.Type
      );
      expect(!!foundInType).toBeTruthy();
    });

    it("should add to usedInStatementProps from prop.value", () => {
      const foundInValue = response.usedInStatementProps.find(
        (u) =>
          u.statement.id === linkedActant.id &&
          u.position === UsedInPosition.Value
      );
      expect(!!foundInValue).toBeTruthy();
    });
  });

  describe("linked entry via prop.children[].type & prop.children[].value", () => {
    const response = new ResponseActantDetail(childActant);
    response.walkPropsStatements(linkedActant, linkedActant.props);

    it("should add from prop.children[].type", () => {
      const foundInType = response.usedInMetaProps.find(
        (u) =>
          u.entityId === linkedActant.id && u.position === UsedInPosition.Type
      );
      expect(!!foundInType).toBeTruthy();
    });

    it("should add from prop.children[].value", () => {
      const foundInValue = response.usedInMetaProps.find(
        (u) =>
          u.entityId === linkedActant.id && u.position === UsedInPosition.Value
      );
      expect(!!foundInValue).toBeTruthy();
    });

    it("should add to entities map", () => {
      expect(!!response.entities[linkedActant.id]).toBeTruthy();
    });
  });
});

describe("test ResponseActantDetail.walkLinkedStatements", function () {
  const actant = new Actant({ id: "1" });

  describe("linked via actions.action", () => {
    const response = new ResponseActantDetail(actant);
    const statement1 = new Statement({ id: "2" });
    statement1.data.actions.push(new StatementAction({ action: actant.id }));

    response.walkLinkedStatements([statement1]);

    it("should add entry to usedInStatement under Action position", () => {
      const foundEntry = response.usedInStatement.find(
        (u) =>
          u.statement.id === statement1.id &&
          u.position === UsedInPosition.Action
      );
      expect(!!foundEntry).toBeTruthy();
    });

    it("should add entry to entities map", () => {
      expect(!!response.entities[statement1.id]).toBeTruthy();
    });
  });

  describe("linked via actants.actant", () => {
    const response = new ResponseActantDetail(actant);
    const statement1 = new Statement({ id: "2" });
    statement1.data.actants.push(new StatementActant({ actant: actant.id }));

    response.walkLinkedStatements([statement1]);

    it("should add entry to usedInStatement under Actant position", () => {
      const foundEntry = response.usedInStatement.find(
        (u) =>
          u.statement.id === statement1.id &&
          u.position === UsedInPosition.Actant
      );
      expect(!!foundEntry).toBeTruthy();
    });

    it("should add entry to entities map", () => {
      expect(!!response.entities[statement1.id]).toBeTruthy();
    });
  });

  describe("linked via tag", () => {
    const response = new ResponseActantDetail(actant);
    const statement1 = new Statement({ id: "2" });
    statement1.data.tags.push(actant.id);

    response.walkLinkedStatements([statement1]);

    it("should add entry to usedInStatement under Tag position", () => {
      const foundEntry = response.usedInStatement.find(
        (u) =>
          u.statement.id === statement1.id && u.position === UsedInPosition.Tag
      );
      expect(!!foundEntry).toBeTruthy();
    });

    it("should add entry to entities map", () => {
      expect(!!response.entities[statement1.id]).toBeTruthy();
    });
  });
});

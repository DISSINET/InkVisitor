import "ts-jest";
import Statement, {
  StatementActant,
  StatementAction,
} from "@models/statement/statement";
import { ResponseEntityDetail } from "./response";
import { EntityClass, UsedInPosition } from "@shared/enums";
import Prop, { PropSpec } from "@models/prop/prop";
import Entity from "./entity";

describe("test ResponseActantDetail.walkPropsStatements", function () {
  const baseActant = new Entity({ id: "1" });
  const childActant = new Entity({ id: "2" });
  const linkedActant = new Entity({
    id: "3",
    class: EntityClass.Statement,
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
    const response = new ResponseEntityDetail(baseActant);
    response.walkEntityProps(linkedActant, linkedActant.props);

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
        (u: any) =>
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
    const response = new ResponseEntityDetail(childActant);
    response.walkEntityProps(linkedActant, linkedActant.props);

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
  const actant = new Entity({ id: "1" });

  describe("linked via actions.action", () => {
    const response = new ResponseEntityDetail(actant);
    const statement1 = new Statement({ id: "2" });
    statement1.data.actions.push(new StatementAction({ action: actant.id }));

    response.walkStatementsDataEntities([statement1]);

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
    const response = new ResponseEntityDetail(actant);
    const statement1 = new Statement({ id: "2" });
    statement1.data.actants.push(new StatementActant({ actant: actant.id }));

    response.walkStatementsDataEntities([statement1]);

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
    const response = new ResponseEntityDetail(actant);
    const statement1 = new Statement({ id: "2" });
    statement1.data.tags.push(actant.id);

    response.walkStatementsDataEntities([statement1]);

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

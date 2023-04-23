import Action from "@models/action/action";
import Group from "@models/group/group";
import Location from "@models/location/location";
import Person from "@models/person/person";
import { EntityEnums, StatementEnums, WarningTypeEnums } from "@shared/enums";
import { IAction, IEntity } from "@shared/types";
import { InternalServerError } from "@shared/types/errors";
import "ts-jest";
import { ResponseStatement } from "./response";
import Statement, { StatementActant, StatementAction } from "./statement";
import { prepareStatement } from "./statement.test";

class MockResponse extends ResponseStatement {
  static new(): MockResponse {
    const statement = new Statement({ id: "statement" });
    return new MockResponse(statement);
  }

  // @ts-ignore
  addAction(map: { [key: EntityEnums.Position]: EntityEnums.Class[] }) {
    const action = new Action({
      id: `action-${this.data.actions.length + 1}`,
    });
    for (const key of Object.keys(map)) {
      const pos = key as EntityEnums.Position;
      // @ts-ignore
      action.data.entities[pos] = map[key];
    }

    this.data.actions.push(new StatementAction({ actionId: action.id }));
    this.entities[action.id] = action;
  }

  addActant(actant: IEntity, pos: EntityEnums.Position) {
    this.data.actants.push(
      new StatementActant({
        entityId: actant.id,
        position: pos,
      })
    );
    this.entities[actant.id] = actant;
    return actant;
  }
}

describe("models/statement/response", function () {
  test("test ResponseStatement.sortListOfStatementItems", function () {
    const sorted = ResponseStatement.sortListOfStatementItems([
      {
        entityId: "1",
        elementId: "1",
        type: StatementEnums.ElementType.Actant,
        order: 1,
      },
      {
        entityId: "2",
        elementId: "2",
        type: StatementEnums.ElementType.Actant,
        order: false,
      },
      {
        entityId: "3",
        elementId: "3",
        type: StatementEnums.ElementType.Actant,
        order: 5,
      },
      {
        entityId: "4",
        elementId: "4",
        type: StatementEnums.ElementType.Actant,
        order: 3,
      },
      {
        entityId: "5",
        elementId: "5",
        type: StatementEnums.ElementType.Actant,
        order: 1,
      },
      {
        entityId: "6",
        elementId: "6",
        type: StatementEnums.ElementType.Actant,
        order: false,
      },
    ]);

    expect(sorted.map((e) => e.elementId)).toStrictEqual([
      "1",
      "5",
      "4",
      "3",
      "2",
      "6",
    ]);
  });

  describe("test ResponseStatement.getWarnings", function () {
    test("not prepared entity should thrown an error", () => {
      const [, statement] = prepareStatement();
      const response = new ResponseStatement(statement);
      expect(() => response.getWarnings()).toThrowError(InternalServerError);
    });

    test("warningless statement response", () => {
      const statement = new Statement({ id: "statement" });
      const action1 = new Action({ id: "action1" });
      action1.data.entities.s = EntityEnums.PLOGESTRB;
      const action2 = new Action({ id: "action2" });
      action2.data.entities.s = EntityEnums.PLOGESTRB;
      statement.data.actions = [
        new StatementAction({ actionId: action1.id }),
        new StatementAction({ actionId: action2.id }),
      ];

      const person = new Person({ id: "person" });
      const group = new Group({ id: "group" });
      statement.data.actants = [
        new StatementActant({ entityId: person.id }),
        new StatementActant({ entityId: group.id }),
      ];

      const response = new ResponseStatement(statement);
      response.entities[statement.id] = statement;
      response.entities[action1.id] = action1;
      response.entities[action2.id] = action2;
      response.entities[person.id] = person;
      response.entities[group.id] = group;

      expect(response.getWarnings()).toHaveLength(0);
    });

    test("no action", () => {
      const response = MockResponse.new();

      const warnings = response.getWarnings();
      expect(warnings.find((w) => w.type === WarningTypeEnums.NA)).toBeTruthy();
    });

    describe("1 action", () => {
      describe("any", () => {
        test("no actant - MA", () => {
          const response = MockResponse.new();
          response.addAction({
            [EntityEnums.Position.Subject]: EntityEnums.PLOGESTRB,
          });
          const ws = response.getWarnings();
          expect(ws.find((w) => w.type === WarningTypeEnums.MA)).toBeTruthy();
        });

        test("has actants - empty", () => {
          const response = MockResponse.new();
          response.addAction({
            [EntityEnums.Position.Subject]: EntityEnums.PLOGESTRB,
          });
          const person = new Person({ id: "person" });
          const group = new Group({ id: "group" });
          response.addActant(person, EntityEnums.Position.Subject);
          response.addActant(group, EntityEnums.Position.Subject);

          const ws = response.getWarnings();
          expect(ws).toHaveLength(0);
        });
      });

      describe("[P, G]", () => {
        const response = MockResponse.new();
        response.addAction({
          [EntityEnums.Position.Subject]: [
            EntityEnums.Class.Person,
            EntityEnums.Class.Group,
          ],
        });
        const person = new Person({ id: "person" });
        const group = new Group({ id: "group" });
        const location = new Location({ id: "location" });

        response.addActant(person, EntityEnums.Position.Subject);
        response.addActant(group, EntityEnums.Position.Subject);
        response.addActant(location, EntityEnums.Position.Subject);

        it("should only accept P & G, L should has a warning", () => {
          const ws = response.getWarnings();
          expect(ws).toHaveLength(1);
          expect(
            ws.find(
              (w) =>
                w.type === WarningTypeEnums.WA &&
                w.position.entityId === location.id
            )
          ).toBeTruthy();
        });
      });

      describe("empty", () => {
        it("should return OK for no actant", () => {
          const response = MockResponse.new();
          response.addAction({ [EntityEnums.Position.Subject]: [] });
          const ws = response.getWarnings();
          expect(ws).toHaveLength(0);
        });

        it("should return AMA for empty rules", () => {
          const response = MockResponse.new();
          response.addAction({ [EntityEnums.Position.Subject]: [] });
          const act1 = response.addActant(
            new Person({ id: "person" }),
            EntityEnums.Position.Subject
          );
          const act2 = response.addActant(
            new Group({ id: "group" }),
            EntityEnums.Position.Subject
          );

          const ws = response.getWarnings();
          expect(
            ws.find(
              (w) =>
                (w.type === WarningTypeEnums.ANA &&
                  w.position.entityId === act1.id) ||
                w.position.entityId === act2.id
            )
          ).toBeTruthy();
          expect(ws).toHaveLength(1);
        });
      });
    });

    describe("2 actions", () => {
      describe("any + any", () => {
        const prepareResponse = () => {
          const response = MockResponse.new();
          response.addAction({
            [EntityEnums.Position.Subject]: EntityEnums.PLOGESTRB,
          });
          response.addAction({
            [EntityEnums.Position.Subject]: EntityEnums.PLOGESTRB,
          });

          return response;
        };

        test("no actant - MA", () => {
          const response = prepareResponse();
          const ws = response.getWarnings();
          expect(ws.find((w) => w.type === WarningTypeEnums.MA)).toBeTruthy();
        });

        test("has actants - no warning", () => {
          const response = prepareResponse();
          const person = new Person({ id: "person" });
          const group = new Group({ id: "group" });
          response.addActant(person, EntityEnums.Position.Subject);
          response.addActant(group, EntityEnums.Position.Subject);

          const ws = response.getWarnings();
          expect(ws).toHaveLength(0);
        });
      });

      describe("any + P", () => {
        const prepareResponse = () => {
          const response = MockResponse.new();
          response.addAction({
            [EntityEnums.Position.Subject]: EntityEnums.PLOGESTRB,
          });
          response.addAction({
            [EntityEnums.Position.Subject]: [EntityEnums.Class.Person],
          });

          return response;
        };

        it("should return MA if no actant", () => {
          const ws = prepareResponse().getWarnings();
          expect(ws).toHaveLength(1);
          expect(ws.find((w) => w.type === WarningTypeEnums.MA)).toBeTruthy();
        });

        describe("with actant(s)", () => {
          const person = new Person({ id: "person" });
          const person2 = new Person({ id: "person2" });
          const group = new Group({ id: "group" });
          const location = new Location({ id: "location" });

          it("should process P as OK", () => {
            const response = prepareResponse();
            response.addActant(person, EntityEnums.Position.Subject);
            const ws = response.getWarnings();

            expect(ws).toHaveLength(0);
          });

          it("should process G as WA", () => {
            const response = prepareResponse();
            response.addActant(group, EntityEnums.Position.Subject);
            const ws = response.getWarnings();

            expect(ws).toHaveLength(1);
            expect(
              ws.find(
                (w) =>
                  w.type === WarningTypeEnums.WA &&
                  w.position.entityId === group.id
              )
            ).toBeTruthy();
          });

          it("should process P + P as OK", () => {
            const response = prepareResponse();
            response.addActant(person, EntityEnums.Position.Subject);
            response.addActant(person2, EntityEnums.Position.Subject);
            const ws = response.getWarnings();

            expect(ws).toHaveLength(0);
          });

          it("should process P + G as WA, because G is not in the second action", () => {
            const response = prepareResponse();
            response.addActant(person, EntityEnums.Position.Subject);
            response.addActant(group, EntityEnums.Position.Subject);
            const ws = response.getWarnings();

            expect(ws).toHaveLength(1);
            expect(
              ws.find(
                (w) =>
                  w.type === WarningTypeEnums.WA &&
                  w.position.entityId === group.id
              )
            ).toBeTruthy();
          });
        });
      });

      describe("at least 1 empty", () => {
        const prepareResponse = () => {
          const response = MockResponse.new();
          response.addAction({
            [EntityEnums.Position.Subject]: EntityEnums.PLOGESTRB,
          });
          response.addAction({
            [EntityEnums.Position.Subject]: [],
          });

          return response;
        };

        it("should return WAC for no actant", () => {
          const response = prepareResponse();
          const ws = response.getWarnings();
          expect(ws).toHaveLength(1);
          expect(ws.find((w) => w.type === WarningTypeEnums.WAC)).toBeTruthy();
        });

        it("should return WAC for 2 actants", () => {
          const response = prepareResponse();
          response.addActant(
            new Person({ id: "person" }),
            EntityEnums.Position.Subject
          );
          response.addActant(
            new Group({ id: "group" }),
            EntityEnums.Position.Subject
          );
          const ws = response.getWarnings();
          expect(ws).toHaveLength(1);
          expect(ws.find((w) => w.type === WarningTypeEnums.WAC)).toBeTruthy();
        });
      });

      describe("P + [P,G]", () => {
        const prepareResponse = () => {
          const response = MockResponse.new();
          response.addAction({
            [EntityEnums.Position.Subject]: EntityEnums.Class.Person,
          });
          response.addAction({
            [EntityEnums.Position.Subject]: [
              EntityEnums.Class.Person,
              EntityEnums.Class.Group,
            ],
          });

          return response;
        };

        it("should return OK for single P actant", () => {
          const response = prepareResponse();
          response.addActant(
            new Person({ id: "person1" }),
            EntityEnums.Position.Subject
          );
          const ws = response.getWarnings();
          expect(ws).toHaveLength(0);
        });

        it("should return OK for two P actant", () => {
          const response = prepareResponse();
          response.addActant(
            new Person({ id: "person1" }),
            EntityEnums.Position.Subject
          );
          response.addActant(
            new Person({ id: "person2" }),
            EntityEnums.Position.Subject
          );
          const ws = response.getWarnings();
          expect(ws).toHaveLength(0);
        });

        it("should return WA if P + G", () => {
          const response = prepareResponse();
          response.addActant(
            new Person({ id: "person" }),
            EntityEnums.Position.Subject
          );
          response.addActant(
            new Group({ id: "group" }),
            EntityEnums.Position.Subject
          );
          const ws = response.getWarnings();
          expect(ws).toHaveLength(1);
          expect(ws.find((w) => w.type === WarningTypeEnums.WA)).toBeTruthy();
        });
      });
    });
  });
});

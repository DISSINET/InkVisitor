import "ts-jest";
import Statement, {
  StatementActant,
  StatementAction,
  StatementClassification,
  StatementData,
  StatementIdentification,
} from "@models/statement/statement";
import { ResponseEntityDetail } from "./response";
import { EntityEnums } from "@shared/enums";
import Prop, { PropSpec } from "@models/prop/prop";
import Entity from "./entity";
import { prepareStatement } from "@models/statement/statement.test";
import { IResponseUsedInStatementClassification, IResponseUsedInStatementIdentification } from "@shared/types/response-detail";
import { IStatement } from "@shared/types";
import { prepareEntity } from "./entity.test";

describe("models/entity/response", function () {
  describe("test ResponseEntityDetail.walkEntityProps", function () {
    const firstEntity = new Entity({ id: "1" });
    const secondEntity = new Entity({ id: "2" });
    const origin = "origin";

    describe("linked entry via prop.type & prop.children.value", () => {
      const response = new ResponseEntityDetail(firstEntity);
      const [, linkedEntity] = prepareEntity();
      linkedEntity.props[0].type.entityId = firstEntity.id
      linkedEntity.props[0].value.entityId = secondEntity.id
      linkedEntity.props[0].children[0].type.entityId = secondEntity.id
      linkedEntity.props[0].children[0].value.entityId = firstEntity.id

      response.walkEntityProps(origin, linkedEntity.props);

      it("should add to usedInMetaProps from prop.type", () => {
        const foundInType = response.usedInMetaProps.find(
          (u) => u.originId === origin && u.typeId === firstEntity.id && u.valueId === secondEntity.id
        );
        expect(!!foundInType).toBeTruthy();
      });

      it("should have both props && props.children items in usedInMetaProps", () => {
        expect(response.usedInMetaProps.length).toEqual(2)
      });

      it("should add to linkedEntitiesIds map", () => {
        expect(Object.keys(response.linkedEntitiesIds)).toEqual([firstEntity.id, secondEntity.id, origin]);
      });
    });

    describe("linked entry via prop.children.type & prop.children.value", () => {
      const response = new ResponseEntityDetail(firstEntity);
      const [, linkedEntity] = prepareEntity();
      linkedEntity.props[0].children[0].type.entityId = firstEntity.id
      linkedEntity.props[0].children[0].value.entityId = firstEntity.id

      response.walkEntityProps(origin, linkedEntity.props);

      it("should add to usedInMetaProps from prop.type", () => {
        const foundInType = response.usedInMetaProps.find(
          (u) => u.originId === origin && u.typeId === firstEntity.id && u.valueId === firstEntity.id
        );
        expect(!!foundInType).toBeTruthy();
      });

      it("only one item should be in usedInMetaProps", () => {
        expect(response.usedInMetaProps.length).toEqual(1)
      });

      it("should add to linkedEntitiesIds map", () => {
        expect(Object.keys(response.linkedEntitiesIds)).toEqual([firstEntity.id, origin]);
      });
    });
  });

  describe("test ResponseEntityDetail.walkStatementsDataEntities", function () {
    const entity = new Entity({ id: "1" });

    describe("linked via actions.action", () => {
      const response = new ResponseEntityDetail(entity);
      const st = new Statement({ id: "2" });
      st.data.actions.push(new StatementAction({ actionId: entity.id }));

      response.walkStatementsDataEntities([st]);

      it("should add entry to usedInStatements under Action position", () => {
        const foundEntry = response.usedInStatements.find(
          (u) =>
            u.statement.id === st.id &&
            u.position === EntityEnums.UsedInPosition.Action
        );
        expect(!!foundEntry).toBeTruthy();
      });

      it("should add entry to linkedEntitiesIds map", () => {
        expect(Object.keys(response.linkedEntitiesIds).find(i => i === st.id)).toBeTruthy();
      });
    });

    describe("linked via actants.actant", () => {
      const response = new ResponseEntityDetail(entity);
      const st = new Statement({ id: "2" });
      st.data.actants.push(new StatementActant({ entityId: entity.id }));

      response.walkStatementsDataEntities([st]);

      it("should add entry to usedInStatements under Actant position", () => {
        const foundEntry = response.usedInStatements.find(
          (u) =>
            u.statement.id === st.id &&
            u.position === EntityEnums.UsedInPosition.Actant
        );
        expect(!!foundEntry).toBeTruthy();
      });

      it("should add entry to linkedEntitiesIds map", () => {
        expect(Object.keys(response.linkedEntitiesIds).find(i => i === st.id)).toBeTruthy();
      });
    });

    describe("linked via tag", () => {
      const response = new ResponseEntityDetail(entity);
      const st = new Statement({ id: "2" });
      st.data.tags.push(entity.id);

      response.walkStatementsDataEntities([st]);

      it("should add entry to usedInStatements under Tag position", () => {
        const foundEntry = response.usedInStatements.find(
          (u) =>
            u.statement.id === st.id && u.position === EntityEnums.UsedInPosition.Tag
        );
        expect(!!foundEntry).toBeTruthy();
      });

      it("should add entry to linkedEntitiesIds map", () => {
        expect(Object.keys(response.linkedEntitiesIds).find(i => i === st.id)).toBeTruthy();
      });
    });
  });

  describe("test ResponseEntityDetail.walkStatementsDataProps", function () {
    const entity = new Entity({ id: "1" });

    describe("linked via actions.props.value", () => {
      const [, st] = prepareStatement();
      const response = new ResponseEntityDetail(entity);
      st.data.actions[0].props[0].value.entityId = entity.id;

      response.walkStatementsDataProps([st]);

      it("should add entry to usedInStatementProps under Value position", () => {
        const foundEntry = response.usedInStatementProps.find(
          (u) => u.statementId === st.id
        );
        expect(!!foundEntry).toBeTruthy();
      });

      it("should add entry to linkedEntitiesIds map", () => {
        expect(Object.keys(response.linkedEntitiesIds).find(i => i === st.id)).toBeTruthy();
      });
    });

    describe("linked via actions.props.type", () => {
      const [, st] = prepareStatement();
      const response = new ResponseEntityDetail(entity);
      st.data.actions[0].props[0].type.entityId = entity.id;

      response.walkStatementsDataProps([st]);

      it("should add entry to usedInStatementProps under Type position", () => {
        const foundEntry = response.usedInStatementProps.find(
          (u) => u.statementId === st.id
        );
        expect(!!foundEntry).toBeTruthy();
      });

      it("should add entry to linkedEntitiesIds map", () => {
        expect(Object.keys(response.linkedEntitiesIds).find(i => i === st.id)).toBeTruthy();
      });
    });

    describe("linked via actions.props.children.type", () => {
      const [, st] = prepareStatement();
      const response = new ResponseEntityDetail(entity);
      st.data.actions[0].props[0].children[0].type.entityId = entity.id;

      response.walkStatementsDataProps([st]);

      it("should add entry to usedInStatementProps under Type position", () => {
        const foundEntry = response.usedInStatementProps.find(
          (u) => u.statementId === st.id
        );
        expect(!!foundEntry).toBeTruthy();
      });

      it("should add entry to linkedEntitiesIds map", () => {
        expect(Object.keys(response.linkedEntitiesIds)).toEqual([entity.id, st.id, st.data.actions[0].actionId, st.data.actions[0].props[0].children[0].value.entityId])
      });
    });

    describe("linked via actions.props.children.children.type", () => {
      const [, st] = prepareStatement();
      const response = new ResponseEntityDetail(entity);
      st.data.actions[0].props[0].children[0].children[0].type.entityId =
        entity.id;

      response.walkStatementsDataProps([st]);

      it("should add entry to usedInStatementProps under Type position", () => {
        const foundEntry = response.usedInStatementProps.find(
          (u) => u.statementId === st.id
        );
        expect(!!foundEntry).toBeTruthy();
      });

      it("should add entry to linkedEntitiesIds map", () => {
        expect(Object.keys(response.linkedEntitiesIds)).toEqual([entity.id, st.id, st.data.actions[0].actionId, st.data.actions[0].props[0].children[0].children[0].value.entityId])
      });
    });

    describe("linked via actions.props.children.children.type and another linked via actions.props.value", () => {
      const [, st1] = prepareStatement();
      const [, st2] = prepareStatement();

      const response = new ResponseEntityDetail(entity);
      st1.data.actions[0].props[0].children[0].children[0].type.entityId = entity.id;
      st2.data.actions[0].props[0].value.entityId = entity.id;

      response.walkStatementsDataProps([st1, st2]);

      it("should add first entry to usedInStatementProps under Type position", () => {
        const foundEntry = response.usedInStatementProps.find(
          (u) => u.statementId === st1.id
        );
        expect(!!foundEntry).toBeTruthy();
      });

      it("should add second entry to usedInStatementProps under Value position", () => {
        const foundEntry = response.usedInStatementProps.find(
          (u) => u.statementId === st2.id
        );
        expect(!!foundEntry).toBeTruthy();
      });

      it("should add both entries to linkedEntitiesIds map", () => {
        expect(Object.keys(response.linkedEntitiesIds).find(k => k === st1.id)).toBeTruthy();
        expect(Object.keys(response.linkedEntitiesIds).find(k => k === st2.id)).toBeTruthy();
      });
    });
  });

  describe("test ResponseEntityDetail.populateInStatementsRelations", function () {
    describe("Empty data", function () {
      const responseEmpty = new ResponseEntityDetail(new Entity({}));

      beforeAll(async () => {
        await responseEmpty.populateInStatementsRelations([]);
      })

      it("should yield empty relations", function () {
        expect(responseEmpty.usedInStatementIdentifications.length).toBe(0);
        expect(responseEmpty.usedInStatementClassifications.length).toBe(0);
        expect(Object.keys(responseEmpty.linkedEntitiesIds).length).toBe(0);
      });
    });

    describe("with usedInStatements", function () {
      const id = Math.random().toString()
      const correctIdentification = new StatementIdentification({
        certainty: EntityEnums.Certainty.Dubious,
        entityId: id,
      })
      const correctClassification = new StatementClassification({
        certainty: EntityEnums.Certainty.Possible,
        entityId: id,
      })
      const statementId = `${id}-statement`;

      const responseEmpty = new ResponseEntityDetail(new Entity({ id }));
      responseEmpty.usedInStatements = [
        // wont be used
        {
          position: EntityEnums.UsedInPosition.Tag,
          statement: new Statement({}),
        },
        // wont be used - no classification / identification in the actant (optional)
        {
          position: EntityEnums.UsedInPosition.Actant,
          statement: new Statement({
            data: new StatementData({
              actants: [new StatementActant({
                entityId: id,
              })]
            })
          })
        },
        {
          position: EntityEnums.UsedInPosition.Actant,
          statement: new Statement({
            id: statementId,
            data: new StatementData({
              actants: [new StatementActant({
                entityId: id,
                classifications: [correctClassification],
                identifications: [correctIdentification],
              })]
            })
          })
        }
      ]

      beforeAll(async () => {
        await responseEmpty.populateInStatementsRelations([]);
      })

      it("should have 2 idems in linkedEntitiesIds map", function () {
        expect(Object.keys(responseEmpty.linkedEntitiesIds)).toEqual([statementId]);
      });

      it("should have expected classification & identification", function () {
        const wantedIdentification: IResponseUsedInStatementIdentification = {
          actantEntityId: id,
          data: correctIdentification,
          relationEntityId: id,
          statementId: statementId,
        }
        expect(responseEmpty.usedInStatementIdentifications.length).toBe(1);
        expect(responseEmpty.usedInStatementIdentifications[0]).toEqual(wantedIdentification);

        const wantedClassification: IResponseUsedInStatementClassification = {
          actantEntityId: id,
          data: correctClassification,
          relationEntityId: id,
          statementId: statementId,
        }

        expect(responseEmpty.usedInStatementClassifications.length).toBe(1);
        expect(responseEmpty.usedInStatementClassifications[0]).toEqual(wantedClassification);
      });
    });

    describe("with statements", function () {
      const id = Math.random().toString()
      const correctIdentification = new StatementIdentification({
        certainty: EntityEnums.Certainty.Dubious,
        entityId: id,
      })
      const correctClassification = new StatementClassification({
        certainty: EntityEnums.Certainty.Possible,
        entityId: id,
      })
      const statementId = `${id}-statement`;

      const responseEmpty = new ResponseEntityDetail(new Entity({ id }));

      const statements: IStatement[] = [
        // not matched identification
        new Statement({
          data: new StatementData({
            actants: [
              new StatementActant({
                identifications: [{ ...correctIdentification, entityId: "invalid" }]
              })
            ]
          })
        }),
        // valid identifications & classifications
        new Statement({
          id: statementId,
          data: new StatementData({
            actants: [
              new StatementActant({
                entityId: "1", // different from entity id
                identifications: [correctIdentification],
                classifications: [correctClassification],
              })
            ]
          })
        })
      ];

      beforeAll(async () => {
        await responseEmpty.populateInStatementsRelations(statements);
      })

      it("should have filled linkedEntitiesIds map", function () {
        expect(Object.keys(responseEmpty.linkedEntitiesIds)).toEqual([statementId]);
      });

      it("should have expected classification & identification", function () {
        const wantedIdentification: IResponseUsedInStatementIdentification = {
          actantEntityId: "1",
          data: correctIdentification,
          relationEntityId: id,
          statementId: statementId,
        }
        expect(responseEmpty.usedInStatementIdentifications.length).toBe(1);
        expect(responseEmpty.usedInStatementIdentifications[0]).toEqual(wantedIdentification);

        const wantedClassification: IResponseUsedInStatementClassification = {
          actantEntityId: "1",
          data: correctClassification,
          relationEntityId: id,
          statementId: statementId,
        }
        expect(responseEmpty.usedInStatementClassifications.length).toBe(1);
        expect(responseEmpty.usedInStatementClassifications[0]).toEqual(wantedClassification);
      });
    });
  })
})

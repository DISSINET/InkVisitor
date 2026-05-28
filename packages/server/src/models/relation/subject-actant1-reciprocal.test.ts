import "ts-jest";
import Relation from "./relation";
import SubjectActant1Reciprocal from "./subject-actant1-reciprocal";
import Entity from "@models/entity/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { RelationPathExist } from "@inkvisitor/shared/types/errors";
import { IRequest } from "../../custom_typings/request";

describe("test SubjectActant1Reciprocal.beforeSave - symmetric duplicate detection", function () {
  const mockRequest = {
    db: { connection: {} },
  } as unknown as IRequest;

  const makeActions = (...ids: string[]) =>
    ids.map((id) => new Entity({ id, class: EntityEnums.Class.Action }));

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("rejects exact duplicate [A, B] when [A, B] exists", async () => {
    const existing = new SubjectActant1Reciprocal({
      id: "existing",
      entityIds: ["A", "B"],
    });
    jest.spyOn(Relation, "getByType").mockResolvedValue([existing]);

    const candidate = new SubjectActant1Reciprocal({
      id: "candidate",
      entityIds: ["A", "B"],
    });
    candidate.entities = makeActions("A", "B");

    await expect(candidate.beforeSave(mockRequest)).rejects.toBeInstanceOf(
      RelationPathExist
    );
  });

  test("rejects reversed [B, A] when [A, B] exists (symmetric)", async () => {
    const existing = new SubjectActant1Reciprocal({
      id: "existing",
      entityIds: ["A", "B"],
    });
    jest.spyOn(Relation, "getByType").mockResolvedValue([existing]);

    const candidate = new SubjectActant1Reciprocal({
      id: "candidate",
      entityIds: ["B", "A"],
    });
    candidate.entities = makeActions("B", "A");

    await expect(candidate.beforeSave(mockRequest)).rejects.toBeInstanceOf(
      RelationPathExist
    );
  });

  test("allows [A, C] when [A, B] exists - different partner is fine", async () => {
    const existing = new SubjectActant1Reciprocal({
      id: "existing",
      entityIds: ["A", "B"],
    });
    jest.spyOn(Relation, "getByType").mockResolvedValue([existing]);

    const candidate = new SubjectActant1Reciprocal({
      id: "candidate",
      entityIds: ["A", "C"],
    });
    candidate.entities = makeActions("A", "C");

    await expect(candidate.beforeSave(mockRequest)).resolves.not.toThrowError();
  });
});

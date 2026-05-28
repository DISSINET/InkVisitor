import "ts-jest";
import Relation from "./relation";
import PropertyReciprocal from "./property-reciprocal";
import Entity from "@models/entity/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { RelationPathExist } from "@inkvisitor/shared/types/errors";
import { IRequest } from "../../custom_typings/request";

describe("test PropertyReciprocal.beforeSave - symmetric duplicate detection", function () {
  const mockRequest = {
    db: { connection: {} },
  } as unknown as IRequest;

  const makeConcepts = (...ids: string[]) =>
    ids.map((id) => new Entity({ id, class: EntityEnums.Class.Concept }));

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("rejects exact duplicate [A, B] when [A, B] exists", async () => {
    const existing = new PropertyReciprocal({
      id: "existing",
      entityIds: ["A", "B"],
    });
    jest.spyOn(Relation, "getByType").mockResolvedValue([existing]);

    const candidate = new PropertyReciprocal({
      id: "candidate",
      entityIds: ["A", "B"],
    });
    candidate.entities = makeConcepts("A", "B");

    await expect(candidate.beforeSave(mockRequest)).rejects.toBeInstanceOf(
      RelationPathExist
    );
  });

  test("rejects reversed [B, A] when [A, B] exists (symmetric)", async () => {
    const existing = new PropertyReciprocal({
      id: "existing",
      entityIds: ["A", "B"],
    });
    jest.spyOn(Relation, "getByType").mockResolvedValue([existing]);

    const candidate = new PropertyReciprocal({
      id: "candidate",
      entityIds: ["B", "A"],
    });
    candidate.entities = makeConcepts("B", "A");

    await expect(candidate.beforeSave(mockRequest)).rejects.toBeInstanceOf(
      RelationPathExist
    );
  });

  test("allows [A, C] when [A, B] exists - different partner is fine", async () => {
    const existing = new PropertyReciprocal({
      id: "existing",
      entityIds: ["A", "B"],
    });
    jest.spyOn(Relation, "getByType").mockResolvedValue([existing]);

    const candidate = new PropertyReciprocal({
      id: "candidate",
      entityIds: ["A", "C"],
    });
    candidate.entities = makeConcepts("A", "C");

    await expect(candidate.beforeSave(mockRequest)).resolves.not.toThrowError();
  });
});

import "ts-jest";
import { Db } from "@service/rethink";
import { deleteRelations } from "@service/shorthands";
import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { ITerritory } from "@inkvisitor/shared/types";
import { saveRelationFixture } from "../../test/relations";
import {
  EProtocolTieType,
  EValidationExpansionKind,
  ITerritoryValidation,
} from "@inkvisitor/shared/types/territory";

import { expansionKey } from "./validation-expansion";
import { buildValidationExpansionMap } from "./validation-expansion-load";

/**
 * The expansion of a rule against real relations: the mocked unit tests pin
 * which walk each field asks for, this pins what the database answers.
 */
describe("models/entity/validation-expansion against the database", () => {
  const db = new Db();

  const saveRelation = (
    type: RelationEnums.Type,
    entityIds: [string, string]
  ): Promise<void> => saveRelationFixture(db.connection, type, entityIds);

  const territory = (validation: ITerritoryValidation): ITerritory =>
    ({
      id: "T0",
      class: EntityEnums.Class.Territory,
      data: { parent: false, validations: [validation] },
    } as ITerritory);

  beforeAll(async () => {
    await db.initDb();
    await deleteRelations(db);

    // dog -SCL-> animal, puppy -SCL-> dog: two levels of subclasses
    await saveRelation(RelationEnums.Type.Superclass, [
      "dog",
      "animal",
    ]);
    await saveRelation(RelationEnums.Type.Superclass, [
      "puppy",
      "dog",
    ]);
    // paw -HOL-> animal: a part of an animal, which a rule must never accept
    await saveRelation(RelationEnums.Type.Holonym, [
      "paw",
      "animal",
    ]);
    // wordnet-3-1 -SOE-> wordnet, wordnet-3-1-1 -SOE-> wordnet-3-1
    await saveRelation(RelationEnums.Type.SuperordinateEntity, [
      "wordnet-3-1",
      "wordnet",
    ]);
    await saveRelation(RelationEnums.Type.SuperordinateEntity, [
      "wordnet-3-1-1",
      "wordnet-3-1",
    ]);
    // animal -SYN- animal-synonym
    await saveRelation(RelationEnums.Type.Synonym, [
      "animal",
      "animal-synonym",
    ]);
  }, 60000);

  afterAll(async () => {
    await deleteRelations(db);
    await db.close();
  }, 60000);

  const expansionOf = async (
    validation: ITerritoryValidation,
    kind: EValidationExpansionKind,
    entityId: string
  ): Promise<string[] | undefined> => {
    const map = await buildValidationExpansionMap(db.connection, [
      territory(validation),
    ]);
    return map.get(expansionKey(kind, entityId))?.sort();
  };

  test("a Concept-valued field collects subclasses at every level, and no meronyms", async () => {
    expect(
      await expansionOf(
        {
          tieType: EProtocolTieType.Classification,
          detail: "",
          entityClassifications: ["animal"],
          expansions: { entityClassifications: { subordinates: true } },
        },
        EValidationExpansionKind.Subclasses,
        "animal"
      )
    ).toEqual(["dog", "puppy"]);
  });

  test("a Reference tie's allowed list collects subordinates at every level", async () => {
    expect(
      await expansionOf(
        {
          tieType: EProtocolTieType.Reference,
          detail: "",
          allowedEntities: ["wordnet"],
          expansions: { allowedEntities: { subordinates: true } },
        },
        EValidationExpansionKind.Subordinates,
        "wordnet"
      )
    ).toEqual(["wordnet-3-1", "wordnet-3-1-1"]);
  });

  test("the equivalents box collects the synonym cloud", async () => {
    expect(
      await expansionOf(
        {
          tieType: EProtocolTieType.Classification,
          detail: "",
          entityClassifications: ["animal"],
          expansions: { entityClassifications: { equivalents: true } },
        },
        EValidationExpansionKind.Equivalents,
        "animal"
      )
    ).toEqual(["animal-synonym"]);
  });

});

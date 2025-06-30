import { IEntity, Relation as RelationTypes } from "@shared/types";
import { question } from "scripts/import/prompts";
import EntitiesGenerator from "./generate-datasets/entities";
import RelationsGenerator from "./generate-datasets/relations";
import Dataset from "./Dataset";

class Generator extends Dataset {
  entities: EntitiesGenerator;
  relations: RelationsGenerator;

  constructor() {
    super();
    this.entities = new EntitiesGenerator();
    this.relations = new RelationsGenerator();
  }

  async getUserInfo() {
    this.datasetName = await question<string>(
      "Name of the dataset?",
      (input: string): string => {
        return input;
      },
      ""
    );
    if (!this.datasetName) {
      throw new Error("Dataset name should not be empty");
    }

    const entitiesTotalSize = await question<number>(
      "Number of entities?",
      (input: string): number => {
        return parseInt(input) || 0;
      },
      0
    );
    if (entitiesTotalSize <= 0) {
      throw new Error("Entities size should be a positive number");
    }

    const relationsTotalSize = await question<number>(
      "Number of relations? (max half the size of entities)",
      (input: string): number => {
        return parseInt(input) || 0;
      },
      0
    );
    if (relationsTotalSize > entitiesTotalSize / 2) {
      throw new Error(
        "Relations size should not be more than size of entities"
      );
    }
    if (relationsTotalSize < 0) {
      throw new Error("Entities size should not be a negative number");
    }

    this.entities.totalSize = entitiesTotalSize;
    this.relations.totalSize = relationsTotalSize;
  }

  async generate() {
    this.entities.generate();
    this.relations.generate(this.entities.entities);
  }

  async output() {
    let allEntities: IEntity[] = [];
    for (const entities of Object.values(this.entities.entities)) {
      allEntities = allEntities.concat(entities);
    }
    await this.writeFile("entities.json", JSON.stringify(allEntities, null, 4));

    let allRelations: RelationTypes.IRelation[] = [];
    for (const relations of Object.values(this.relations.relations)) {
      allRelations = allRelations.concat(relations);
    }
    await this.writeFile(
      "relations.json",
      JSON.stringify(allRelations, null, 4)
    );
  }
}

export default Generator;

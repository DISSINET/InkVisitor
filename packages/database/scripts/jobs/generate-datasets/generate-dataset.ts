import { IEntity, Relation as RelationTypes } from "@shared/types";
import { Connection } from "rethinkdb-ts";
import { question } from "scripts/import/prompts";
import * as fs from "fs"
import * as path from "path"
import EntitiesGenerator from "./entities";
import RelationsGenerator from "./relations";

class Generator {
  static DIRECTORY = "datasets"
  datasetName: string = "";

  entities: EntitiesGenerator;
  relations: RelationsGenerator;

  constructor() {
    this.entities = new EntitiesGenerator();
    this.relations = new RelationsGenerator();
  }

  getPath(filename?: string) {
    if (!this.datasetName) {
      throw new Error("Dataset name not yet set, cannot create the path to directory")
    }

    let parts = [__dirname, "..", "..", "..", Generator.DIRECTORY, this.datasetName]
    if (filename) {
      parts.push(filename)
    }
    return path.join.apply(undefined, parts)
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
      throw new Error("Dataset name should not be empty")
    }
    const datasetPath = this.getPath()
    if(fs.existsSync(datasetPath)) {
      throw new Error(`The dataset path (${datasetPath}) already exists`)
    }

    const entitiesTotalSize = await question<number>(
      "Number of entities?",
      (input: string): number => {
        return parseInt(input) || 0
      },
      0
    );
    if (entitiesTotalSize <= 0) {
      throw new Error("Entities size should be a positive number")
    }

    const relationsTotalSize = await question<number>(
      "Number of relations? (max half the size of entities)",
      (input: string): number => {
        return parseInt(input) || 0
      },
      0
    );
    if (relationsTotalSize > entitiesTotalSize / 2) {
      throw new Error("Relations size should not be more than size of entities")
    }
    if (relationsTotalSize < 0) {
      throw new Error("Entities size should not be a negative number")
    }

    this.entities.totalSize = entitiesTotalSize;
    this.relations.totalSize = relationsTotalSize;
  }

  async generate() {
    this.entities.generate()
    this.relations.generate(this.entities.entities)
  }

  output() {
    fs.mkdirSync(this.getPath())

    let allEntities: IEntity[] = []
    for (const entities of Object.values(this.entities)) {
      allEntities = allEntities.concat(entities)
    }
    fs.writeFileSync(this.getPath("entities.json"), JSON.stringify(allEntities, null, 4))

    let allRelations: RelationTypes.IRelation[] = []
    for (const relations of Object.values(this.relations)) {
      allRelations = allRelations.concat(relations)
    }

    fs.writeFileSync(this.getPath("relations.json"), JSON.stringify(allRelations, null, 4))
  }
}

const job = async (db: Connection) => {
  const generator = new Generator()
  await generator.getUserInfo()
  generator.generate()
  generator.output();
}

export default job

import entities from "@modules/entities";
import { Db } from "@service/RethinkDB";
import { deleteEntities } from "@service/shorthands";
import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import Entity from "./entity";
import { prepareEntity } from "./entity.test";
import {
  SearchQuery,
  sortByLength,
  sortByRequiredOrder,
  sortByWordMatch,
} from "./response-search";

describe("Response search - advanced label search", function () {
  let db: Db;
  const rand = Math.random().toString();

  const [, nameEntity] = prepareEntity();
  nameEntity.label = "Evelín Teměř Jr.";
  nameEntity.id = `${nameEntity.label}-${nameEntity.id}`;
  nameEntity.class = EntityEnums.Class.Person;

  const [, eventEntity] = prepareEntity();
  eventEntity.label = "TRP yyyy-mm-dd: during";
  eventEntity.id = `${eventEntity.label}-${eventEntity.id}`;
  eventEntity.class = EntityEnums.Class.Event;

  beforeAll(async () => {
    db = new Db();
    await db.initDb();

    await nameEntity.save(db.connection);
    await eventEntity.save(db.connection);
  });

  afterAll(async () => {
    await deleteEntities(db);
    await db.close();
  });

  describe("search by word", () => {
    it("should return found result when searching word by word", async () => {
      const words = eventEntity.label
        .replace(/[^a-zA-Z0-9]+/g, " ")
        .split(" ")
        .map((w) => w.trim());
      for (const word of words) {
        const entities = await new SearchQuery(db.connection)
          .whereLabel(`*${word}*`)
          .do();
        try {
          expect(entities).toHaveLength(1);
        } catch (e) {
          throw new Error(`*${word}* not satisfied`);
        }
      }
    });
  });

  describe("search by parts", () => {
    it("should return found a result when searching by parts", async () => {
      const parts = [
        "Evelín Teměř Jr",
        "Evelín Teměř Jr.",
        "Teměř",
        "Evelín",
        "Jr",
        "Jr.",
        "Temě*",
        "Evel*",
        "Teměř Jr",
      ];
      for (const part of parts) {
        const entities = await new SearchQuery(db.connection)
          .whereLabel(part)
          .do();
        try {
          expect(entities).toHaveLength(1);
        } catch (e) {
          throw new Error(`${part} not satisfied`);
        }
      }
    });
  });
});

describe("test sorting", function () {
  const entitites: IEntity[] = [
    new Entity({ id: "1", label: "one" }),
    new Entity({ id: "2", label: "three" }),
    new Entity({ id: "3", label: "one hundred and six" }),
    new Entity({ id: "4", label: "five" }),
    new Entity({ id: "5", label: "six" }),
    new Entity({ id: "6", label: "seven" }),
    new Entity({ id: "7", label: "eight" }),
    new Entity({ id: "8", label: "eleven" }),
    new Entity({ id: "9", label: "twenty-one" }),
  ];

  describe("sortByLength", () => {
    it("should return entities in expected order", function () {
      const sorted = sortByLength(entitites);
      const sortedLabels = sorted.map((e) => e.label);
      const expectedSortedLabels = [
        "one",
        "six",
        "five",
        "three",
        "seven",
        "eight",
        "eleven",
        "twenty-one",
        "one hundred and six",
        "onehundred",
      ];

      expect(sortedLabels).toEqual(expectedSortedLabels);
    });
  });

  describe("sortByWordMatch without label", () => {
    it("should return entities in unchanged order", function () {
      const sorted = sortByWordMatch(entitites, "");
      const sortedLabels = sorted.map((e) => e.label);
      const expectedSortedLabels = entitites.map((e) => e.label);

      expect(sortedLabels).toEqual(expectedSortedLabels);
    });
  });

  describe("sortByWordMatch with label matching more entities", () => {
    const sorted = sortByWordMatch(entitites, "one");
    const sortedLabels = sorted.map((e) => e.label);

    it("should return first entity to be the one with exact match and smallest length", function () {
      expect(sortedLabels[0]).toEqual("one");
    });

    it("should return second entity the one still matching the word because it is on the lowest index", function () {
      expect(sortedLabels[1]).toEqual("one hundred and six");
    });

    it("should return third entity the one still matching the word because it is on the lowest index", function () {
      expect(sortedLabels[2]).toEqual("twenty-one");
    });

    it("should return fourth entity as the one without matching words but it is stored on lowest index", function () {
      expect(sortedLabels[3]).toEqual("three");
    });
  });

  describe("sortByRequiredOrder with empty wanted list", () => {
    it("should return empty list", function () {
      const sorted = sortByRequiredOrder(entitites, []);
      expect(sorted).toEqual([]);
    });
  });

  describe("sortByRequiredOrder with non empty", () => {
    it("should return first and last entity in expected order", function () {
      const sorted = sortByRequiredOrder(
        entitites,
        entitites.map((e) => e.id).reverse()
      );
      expect(sorted).toHaveLength(entitites.length);
      expect(sorted[0].id).toEqual(entitites[entitites.length - 1].id);
      expect(sorted[sorted.length - 1].id).toEqual(entitites[0].id);
    });
  });
});

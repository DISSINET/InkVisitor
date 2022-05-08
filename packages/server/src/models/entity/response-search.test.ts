import { Db } from "@service/RethinkDB";
import { deleteEntities } from "@service/shorthands";
import { EntityClass } from "@shared/enums";
import { prepareEntity } from "./entity.test";
import { SearchQuery } from "./response-search";

describe("Response search - advanced label search", function () {
  let db: Db;
  const rand = Math.random().toString();

  const [, nameEntity] = prepareEntity();
  nameEntity.label = "Evelín Teměř Jr.";
  nameEntity.id = `${nameEntity.label}-${nameEntity.id}`;
  nameEntity.class = EntityClass.Person;

  const [, eventEntity] = prepareEntity();
  eventEntity.label = "TRP yyyy-mm-dd: during";
  eventEntity.id = `${eventEntity.label}-${eventEntity.id}`;
  eventEntity.class = EntityClass.Event;

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
        "Evelín Jr",
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

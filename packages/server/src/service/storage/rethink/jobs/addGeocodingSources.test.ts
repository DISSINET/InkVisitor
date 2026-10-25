import { Connection, r } from "rethinkdb-ts";
import { getTestDbName } from "../../../../test/db";
import addGeocodingSourcesJob from "../../../../../../database/scripts/jobs/add-geocoding-sources";

/**
 * Naming the gazetteers behind a coordinate from the references a Location
 * already carries, against a real RethinkDB.
 */

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const GEOMETRY = uuid(1);
const ACCURACY = uuid(2);
const SOURCE = uuid(3);
const WIKIDATA = uuid(4);
const GEONAMES = uuid(5);
const SOMETHING_ELSE = uuid(6);

const prop = (n: number, type: string, value: string, children: any[] = []) => ({
  id: uuid(n),
  type: { entityId: type },
  value: { entityId: value },
  elvl: "2",
  certainty: "2",
  children,
});
const reference = (n: number, resource: string) => ({ id: uuid(n), resource, value: uuid(n + 100) });

let conn: Connection;

const location = async (n: number): Promise<any> => r.table("entities").get(uuid(n)).run(conn);
const sourcesOf = (loc: any) =>
  loc.props[0].children
    .filter((c: any) => c.type.entityId === SOURCE)
    .map((c: any) => c.value.entityId);

beforeAll(async () => {
  conn = await r.connect({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 28015,
    password: process.env.DB_AUTH || undefined,
    timeout: 5,
  });
  conn.use(getTestDbName());
});

afterAll(async () => {
  await conn.close();
});

beforeEach(async () => {
  await r.table("entities").delete().run(conn);
  await r.table("settings").delete().run(conn);
  await r
    .table("settings")
    .insert({
      id: "geocoding",
      value: {
        roles: {
          geometry: GEOMETRY,
          accuracy: ACCURACY,
          epistemicSource: SOURCE,
          resources: { wikidata: WIKIDATA, geonames: GEONAMES },
        },
      },
    })
    .run(conn);
  await r
    .table("entities")
    .insert([
      {
        id: uuid(10),
        class: "L",
        labels: ["two gazetteers"],
        props: [prop(40, GEOMETRY, uuid(90), [prop(41, ACCURACY, uuid(91))])],
        references: [reference(50, WIKIDATA), reference(51, GEONAMES), reference(52, SOMETHING_ELSE)],
      },
      {
        id: uuid(11),
        class: "L",
        labels: ["one gazetteer twice"],
        props: [prop(42, GEOMETRY, uuid(92))],
        references: [reference(53, GEONAMES), reference(54, GEONAMES)],
      },
      {
        id: uuid(12),
        class: "L",
        labels: ["already named"],
        props: [prop(43, GEOMETRY, uuid(93), [prop(44, SOURCE, WIKIDATA)])],
        references: [reference(55, WIKIDATA), reference(56, GEONAMES)],
      },
      {
        id: uuid(13),
        class: "L",
        labels: ["not a gazetteer"],
        props: [prop(45, GEOMETRY, uuid(94))],
        references: [reference(57, SOMETHING_ELSE)],
      },
      { id: uuid(14), class: "L", labels: ["no geometry"], props: [], references: [reference(58, WIKIDATA)] },
      {
        id: uuid(15),
        class: "L",
        labels: ["two geometries"],
        props: [prop(46, GEOMETRY, uuid(95)), prop(47, GEOMETRY, uuid(96))],
        references: [reference(59, WIKIDATA)],
      },
      {
        id: uuid(16),
        class: "S",
        labels: ["a statement"],
        props: [prop(48, GEOMETRY, uuid(97))],
        references: [reference(60, WIKIDATA)],
      },
    ])
    .run(conn);
});

describe("add-geocoding-sources", () => {
  it("names each gazetteer a Location cites under its geometry, after what was there", async () => {
    await addGeocodingSourcesJob(conn);
    const named = await location(10);
    expect(named.props[0].children.map((c: any) => c.type.entityId)).toEqual([ACCURACY, SOURCE, SOURCE]);
    expect(sourcesOf(named)).toEqual([WIKIDATA, GEONAMES]);
  });

  it("names a gazetteer once however many of its references there are", async () => {
    await addGeocodingSourcesJob(conn);
    expect(sourcesOf(await location(11))).toEqual([GEONAMES]);
  });

  it("adds only the gazetteers not yet named, and keeps the ones that are", async () => {
    await addGeocodingSourcesJob(conn);
    const loc = await location(12);
    expect(sourcesOf(loc)).toEqual([WIKIDATA, GEONAMES]);
    expect(loc.props[0].children[0].id).toBe(uuid(44));
  });

  it("gives a new prop the levels of the geometry prop it hangs under, and an id of its own", async () => {
    await addGeocodingSourcesJob(conn);
    const [child] = (await location(11)).props[0].children;
    expect(child.type.entityId).toBe(SOURCE);
    expect(child.elvl).toBe("2");
    expect(child.certainty).toBe("2");
    expect(child.id).not.toBe(uuid(42));
  });

  it.each([
    ["a Location citing only a reference that is not a gazetteer", 13],
    ["a Location with no geometry", 14],
    ["a Location with two geometries", 15],
    ["a statement rather than a Location", 16],
  ])("leaves %s untouched", async (_name, n) => {
    const before = await location(n);
    await addGeocodingSourcesJob(conn);
    expect(await location(n)).toEqual(before);
  });

  it("changes nothing on a second run", async () => {
    await addGeocodingSourcesJob(conn);
    const after = await r.table("entities").orderBy("id").run(conn);
    await addGeocodingSourcesJob(conn);
    expect(await r.table("entities").orderBy("id").run(conn)).toEqual(after);
  });

  it("does nothing while the project has not assigned the source Concept", async () => {
    await r
      .table("settings")
      .get("geocoding")
      .replace({
        id: "geocoding",
        value: { roles: { geometry: GEOMETRY, resources: { wikidata: WIKIDATA } } },
      })
      .run(conn);
    const before = await r.table("entities").orderBy("id").run(conn);
    await addGeocodingSourcesJob(conn);
    expect(await r.table("entities").orderBy("id").run(conn)).toEqual(before);
  });
});

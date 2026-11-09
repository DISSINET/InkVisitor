import { EntityEnums } from "@inkvisitor/shared/enums";
import { Connection, r } from "rethinkdb-ts";
import { getTestDbName } from "../../../../test/db";
import addGeocodingSourcesJob, {
  nameSourcesOf,
} from "../../../../../../database/scripts/jobs/add-geocoding-sources";

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

const T0 = new Date("2026-01-01T00:00:00Z");
const later = (ms: number) => new Date(T0.getTime() + ms);
// the geometry and record id Values, with the time they were created where it is known
const value = (n: number, createdAt?: Date) => ({
  id: uuid(n),
  class: "V",
  labels: [`value ${n}`],
  props: [],
  ...(createdAt ? { createdAt } : {}),
});

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
      // geocoded from GeoNames, then moved by a click a day later: the reference
      // is about the first coordinate
      {
        id: uuid(20),
        class: "L",
        labels: ["moved since"],
        props: [prop(71, GEOMETRY, uuid(190))],
        references: [reference(70, GEONAMES)],
      },
      // a reference added by hand, long after the coordinate was written
      {
        id: uuid(21),
        class: "L",
        labels: ["cited later"],
        props: [prop(73, GEOMETRY, uuid(191))],
        references: [reference(72, WIKIDATA)],
      },
      // Values that carry no creation time say nothing about being written together
      {
        id: uuid(22),
        class: "L",
        labels: ["undated"],
        props: [prop(75, GEOMETRY, uuid(192))],
        references: [reference(74, GEONAMES)],
      },
    ])
    .run(conn);
  await r
    .table("entities")
    .insert([
      // the Value of a geometry and the Values of the record ids written with it
      ...[90, 91, 92, 93, 94, 95, 96, 97, 98].map((n) => value(n, T0)),
      ...[150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160].map((n) => value(n, later(2_000))),
      // moved a day after the GeoNames record id was written
      value(190, later(24 * 3_600_000)),
      value(170, T0),
      // cited a week after the coordinate was written
      value(191, T0),
      value(172, later(7 * 24 * 3_600_000)),
      // neither has a creation time
      value(192),
      value(174),
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

  it("gives a new prop the levels the page gives the props it writes, and an id of its own", async () => {
    await addGeocodingSourcesJob(conn);
    const [child] = (await location(11)).props[0].children;
    expect(child.type.entityId).toBe(SOURCE);
    expect(child.value.entityId).toBe(GEONAMES);
    expect(child).toMatchObject({
      elvl: EntityEnums.Elvl.Textual,
      certainty: EntityEnums.Certainty.Empty,
      logic: EntityEnums.Logic.Positive,
      mood: [EntityEnums.Mood.Indication],
      moodvariant: EntityEnums.MoodVariant.Realis,
      children: [],
    });
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

  it("credits no gazetteer for a coordinate that was moved after the reference was written", async () => {
    await addGeocodingSourcesJob(conn);
    expect((await location(20)).props[0].children).toEqual([]);
  });

  it("credits no gazetteer for a reference that was added by hand long after the coordinate", async () => {
    await addGeocodingSourcesJob(conn);
    expect((await location(21)).props[0].children).toEqual([]);
  });

  it("credits nothing where the Values say nothing of when they were written", async () => {
    await addGeocodingSourcesJob(conn);
    expect((await location(22)).props[0].children).toEqual([]);
  });

  it("changes nothing on a second run", async () => {
    await addGeocodingSourcesJob(conn);
    const after = await r.table("entities").orderBy("id").run(conn);
    await addGeocodingSourcesJob(conn);
    expect(await r.table("entities").orderBy("id").run(conn)).toEqual(after);
  });

  it("writes nothing for a Location whose props changed after the job read them", async () => {
    const read = await location(10);
    await r
      .table("entities")
      .get(uuid(10))
      .update({ props: [prop(70, GEOMETRY, uuid(80))] })
      .run(conn);
    const saved = await location(10);

    const outcome = await nameSourcesOf(conn, read, GEOMETRY, SOURCE, new Set([WIKIDATA, GEONAMES]));

    expect(outcome).toEqual({ left: "its props changed while the job ran" });
    expect(await location(10)).toEqual(saved);
  });

  it("does nothing while one Concept is given to two roles", async () => {
    await r
      .table("settings")
      .get("geocoding")
      .replace({
        id: "geocoding",
        value: { roles: { geometry: GEOMETRY, epistemicSource: GEOMETRY, resources: { wikidata: WIKIDATA } } },
      })
      .run(conn);
    const before = await r.table("entities").orderBy("id").run(conn);
    await addGeocodingSourcesJob(conn);
    expect(await r.table("entities").orderBy("id").run(conn)).toEqual(before);
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

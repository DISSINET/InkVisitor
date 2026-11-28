import { EntityEnums } from "@inkvisitor/shared/enums";
import { nameSourcesOf } from "../../../../../database/scripts/jobs/add-geocoding-sources";
import { JobDatabase, openJobDatabase } from "../../../test/jobDatabase";

/**
 * Naming the gazetteers behind a coordinate from the references a Location
 * already carries, against the real database of the adapter the run is set to,
 * RethinkDB or PostgreSQL.
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
const reference = (n: number, resource: string) => ({
  id: uuid(n),
  resource,
  value: uuid(n + 100),
});

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

let db: JobDatabase;

const location = (n: number): Promise<any> => db.entity(uuid(n));
const sourcesOf = (loc: any) =>
  loc.props[0].children
    .filter((c: any) => c.type.entityId === SOURCE)
    .map((c: any) => c.value.entityId);

beforeAll(async () => {
  db = await openJobDatabase();
});

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await db.clear();
  await db.insertSetting({
    id: "geocoding",
    value: {
      roles: {
        geometry: GEOMETRY,
        accuracy: ACCURACY,
        epistemicSource: SOURCE,
        resources: { wikidata: WIKIDATA, geonames: GEONAMES },
      },
    },
  });
  await db.insertEntities([
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
    {
      id: uuid(14),
      class: "L",
      labels: ["no geometry"],
      props: [],
      references: [reference(58, WIKIDATA)],
    },
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
    // an earlier suggestion's GeoNames reference, a minute before the one written
    // now: a write creates its geometry Value before its record id Values
    {
      id: uuid(23),
      class: "L",
      labels: ["written over"],
      props: [prop(77, GEOMETRY, uuid(193))],
      references: [reference(76, GEONAMES)],
    },
    // one of its props has no type, as a malformed import can leave; first, so a
    // search of the props meets it before the geometry
    {
      id: uuid(24),
      class: "L",
      labels: ["a prop without a type"],
      props: [{ id: uuid(79), value: { entityId: uuid(99) }, children: [] }, prop(78, GEOMETRY, uuid(194))],
      references: [reference(85, WIKIDATA)],
    },
  ]);
  await db.insertEntities([
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
    // the record id a minute before the geometry it is checked against
    value(193, later(60_000)),
    value(176, T0),
    value(194, T0),
    value(185, later(2_000)),
  ]);
});

describe("add-geocoding-sources", () => {
  it("names each gazetteer a Location cites under its geometry, after what was there", async () => {
    await db.run("addGeocodingSourcesJob");
    const named = await location(10);
    expect(named.props[0].children.map((c: any) => c.type.entityId)).toEqual([
      ACCURACY,
      SOURCE,
      SOURCE,
    ]);
    expect(sourcesOf(named)).toEqual([WIKIDATA, GEONAMES]);
  });

  it("names a gazetteer once however many of its references there are", async () => {
    await db.run("addGeocodingSourcesJob");
    expect(sourcesOf(await location(11))).toEqual([GEONAMES]);
  });

  it("adds only the gazetteers not yet named, and keeps the ones that are", async () => {
    await db.run("addGeocodingSourcesJob");
    const loc = await location(12);
    expect(sourcesOf(loc)).toEqual([WIKIDATA, GEONAMES]);
    expect(loc.props[0].children[0].id).toBe(uuid(44));
  });

  it("gives a new prop the levels the page gives the props it writes, and an id of its own", async () => {
    await db.run("addGeocodingSourcesJob");
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
    await db.run("addGeocodingSourcesJob");
    expect(await location(n)).toEqual(before);
  });

  it("credits no gazetteer for a coordinate that was moved after the reference was written", async () => {
    await db.run("addGeocodingSourcesJob");
    expect((await location(20)).props[0].children).toEqual([]);
  });

  it("credits no gazetteer for a reference that was added by hand long after the coordinate", async () => {
    await db.run("addGeocodingSourcesJob");
    expect((await location(21)).props[0].children).toEqual([]);
  });

  it("credits no gazetteer for a reference written before the coordinate, by an earlier write", async () => {
    await db.run("addGeocodingSourcesJob");
    expect((await location(23)).props[0].children).toEqual([]);
  });

  it("lists a Location whose references are all older than its coordinate, as a migration leaves it", async () => {
    const outcome = await nameSourcesOf(
      db.rows,
      await location(23),
      GEOMETRY,
      SOURCE,
      new Set([WIKIDATA, GEONAMES])
    );
    expect(outcome).toEqual({
      left: "its gazetteer references are older than its coordinate, which was moved or migrated since",
    });
  });

  it("lists no Location whose reference was added after its coordinate", async () => {
    const outcome = await nameSourcesOf(
      db.rows,
      await location(21),
      GEOMETRY,
      SOURCE,
      new Set([WIKIDATA, GEONAMES])
    );
    expect(outcome).toBe(0);
  });

  it("names the gazetteers of a Location that also carries a prop with no type", async () => {
    await db.run("addGeocodingSourcesJob");
    const geometry = (await location(24)).props.find((p: any) => p.type?.entityId === GEOMETRY);
    expect(geometry.children.map((c: any) => c.value.entityId)).toEqual([WIKIDATA]);
  });

  it("credits nothing where the Values say nothing of when they were written", async () => {
    await db.run("addGeocodingSourcesJob");
    expect((await location(22)).props[0].children).toEqual([]);
  });

  it("changes nothing on a second run", async () => {
    await db.run("addGeocodingSourcesJob");
    const after = await db.entities();
    await db.run("addGeocodingSourcesJob");
    expect(await db.entities()).toEqual(after);
  });

  it("writes nothing for a Location whose props changed after the job read them", async () => {
    const read = await location(10);
    await db.setProps(uuid(10), [prop(70, GEOMETRY, uuid(80))]);
    const saved = await location(10);

    const outcome = await nameSourcesOf(
      db.rows,
      read,
      GEOMETRY,
      SOURCE,
      new Set([WIKIDATA, GEONAMES])
    );

    expect(outcome).toEqual({ left: "its props changed while the job ran" });
    expect(await location(10)).toEqual(saved);
  });

  it("does nothing while one Concept is given to two roles", async () => {
    await db.replaceSetting({
      id: "geocoding",
      value: {
        roles: { geometry: GEOMETRY, epistemicSource: GEOMETRY, resources: { wikidata: WIKIDATA } },
      },
    });
    const before = await db.entities();
    await db.run("addGeocodingSourcesJob");
    expect(await db.entities()).toEqual(before);
  });

  it("does nothing while the project has not assigned the source Concept", async () => {
    await db.replaceSetting({
      id: "geocoding",
      value: { roles: { geometry: GEOMETRY, resources: { wikidata: WIKIDATA } } },
    });
    const before = await db.entities();
    await db.run("addGeocodingSourcesJob");
    expect(await db.entities()).toEqual(before);
  });
});

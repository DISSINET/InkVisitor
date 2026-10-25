import { Connection, r } from "rethinkdb-ts";
import { getTestDbName } from "../../../../test/db";
import nestGeocodingAccuracyJob, {
  nestAccuracyOf,
} from "../../../../../../database/scripts/jobs/nest-geocoding-accuracy";

/**
 * The move of the accuracy prop from beside the geometry prop to under it,
 * against a real RethinkDB, so the Location filter runs in the database.
 */

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const GEOMETRY = uuid(1);
const ACCURACY = uuid(2);
const PRECISE = uuid(3);
const APPROXIMATE = uuid(4);
const OTHER = uuid(5);

const prop = (n: number, type: string, value: string, children: any[] = []) => ({
  id: uuid(n),
  type: { entityId: type },
  value: { entityId: value },
  children,
});

let conn: Connection;

const location = async (n: number): Promise<any> => r.table("entities").get(uuid(n)).run(conn);
const typesOf = (props: any[]) => props.map((p) => p.type.entityId);

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
    .insert({ id: "geocoding", value: { roles: { geometry: GEOMETRY, accuracy: ACCURACY } } })
    .run(conn);
  await r
    .table("entities")
    .insert([
      // accuracy beside the geometry, with an unrelated prop around them
      {
        id: uuid(10),
        class: "L",
        labels: ["beside"],
        props: [prop(40, OTHER, uuid(90)), prop(41, GEOMETRY, uuid(91)), prop(42, ACCURACY, PRECISE)],
      },
      // already under the geometry
      {
        id: uuid(11),
        class: "L",
        labels: ["under"],
        props: [prop(43, GEOMETRY, uuid(92), [prop(44, ACCURACY, PRECISE)])],
      },
      // beside, and the same value is also under
      {
        id: uuid(12),
        class: "L",
        labels: ["both, the same"],
        props: [prop(45, GEOMETRY, uuid(93), [prop(46, ACCURACY, PRECISE)]), prop(47, ACCURACY, PRECISE)],
      },
      // beside, and a different value is under
      {
        id: uuid(13),
        class: "L",
        labels: ["both, differing"],
        props: [prop(48, GEOMETRY, uuid(94), [prop(49, ACCURACY, APPROXIMATE)]), prop(50, ACCURACY, PRECISE)],
      },
      // nothing to put it under
      { id: uuid(14), class: "L", labels: ["no geometry"], props: [prop(51, ACCURACY, PRECISE)] },
      // two of either is not a case to guess at
      {
        id: uuid(15),
        class: "L",
        labels: ["two geometries"],
        props: [prop(52, GEOMETRY, uuid(95)), prop(53, GEOMETRY, uuid(96)), prop(54, ACCURACY, PRECISE)],
      },
      {
        id: uuid(16),
        class: "L",
        labels: ["two accuracies"],
        props: [prop(55, GEOMETRY, uuid(97)), prop(56, ACCURACY, PRECISE), prop(57, ACCURACY, APPROXIMATE)],
      },
      // moving the accuracy down a level would put its grandchildren on a fourth
      {
        id: uuid(18),
        class: "L",
        labels: ["deep accuracy"],
        props: [
          prop(60, GEOMETRY, uuid(99)),
          prop(61, ACCURACY, PRECISE, [prop(62, OTHER, uuid(98), [prop(63, OTHER, uuid(97))])]),
        ],
      },
      // the same accuracy under and beside, and the one beside carries a note
      {
        id: uuid(19),
        class: "L",
        labels: ["noted repeat"],
        props: [
          prop(64, GEOMETRY, uuid(100), [prop(65, ACCURACY, PRECISE)]),
          prop(66, ACCURACY, PRECISE, [prop(67, OTHER, uuid(96))]),
        ],
      },
      // not a Location
      {
        id: uuid(17),
        class: "S",
        labels: ["a statement"],
        props: [prop(58, GEOMETRY, uuid(98)), prop(59, ACCURACY, PRECISE)],
      },
    ])
    .run(conn);
});

describe("nest-geocoding-accuracy", () => {
  it("moves the accuracy under the geometry and keeps every other prop where it was", async () => {
    await nestGeocodingAccuracyJob(conn);

    const moved = await location(10);
    expect(typesOf(moved.props)).toEqual([OTHER, GEOMETRY]);
    const geometry = moved.props[1];
    expect(geometry.id).toBe(uuid(41));
    expect(geometry.value.entityId).toBe(uuid(91));
    expect(geometry.children).toHaveLength(1);
    // the same prop, with its own id, rather than a copy
    expect(geometry.children[0].id).toBe(uuid(42));
    expect(geometry.children[0].value.entityId).toBe(PRECISE);
  });

  it("leaves a Location that already has the accuracy under the geometry as it is", async () => {
    const before = await location(11);
    await nestGeocodingAccuracyJob(conn);
    expect(await location(11)).toEqual(before);
  });

  it("removes a repeated accuracy beside one that says the same under the geometry", async () => {
    await nestGeocodingAccuracyJob(conn);
    const both = await location(12);
    expect(typesOf(both.props)).toEqual([GEOMETRY]);
    expect(both.props[0].children).toHaveLength(1);
  });

  it("leaves a Location untouched where the two accuracies disagree", async () => {
    const before = await location(13);
    await nestGeocodingAccuracyJob(conn);
    expect(await location(13)).toEqual(before);
  });

  it.each([
    ["an accuracy and no geometry", 14],
    ["two geometry props", 15],
    ["two accuracy props", 16],
    ["an accuracy prop whose children have children", 18],
    ["a repeated accuracy beside the geometry that carries a note", 19],
  ])("leaves a Location with %s untouched", async (_name, n) => {
    const before = await location(n);
    await nestGeocodingAccuracyJob(conn);
    expect(await location(n)).toEqual(before);
  });

  it("leaves an entity that is not a Location alone", async () => {
    const before = await location(17);
    await nestGeocodingAccuracyJob(conn);
    expect(await location(17)).toEqual(before);
  });

  it("changes nothing on a second run", async () => {
    await nestGeocodingAccuracyJob(conn);
    const after = await r.table("entities").orderBy("id").run(conn);
    await nestGeocodingAccuracyJob(conn);
    expect(await r.table("entities").orderBy("id").run(conn)).toEqual(after);
  });

  it("writes nothing for a Location whose props changed after the job read them", async () => {
    // a researcher saves the Location between the job's read and its write
    const read = await location(10);
    await r
      .table("entities")
      .get(uuid(10))
      .update({ props: [prop(70, GEOMETRY, uuid(80))] })
      .run(conn);
    const saved = await location(10);

    const outcome = await nestAccuracyOf(conn, read, GEOMETRY, ACCURACY);

    expect(outcome).toEqual({ left: "its props changed while the job ran" });
    expect(await location(10)).toEqual(saved);
  });

  it("does nothing while one Concept is given to two roles", async () => {
    await r
      .table("settings")
      .get("geocoding")
      .replace({ id: "geocoding", value: { roles: { geometry: GEOMETRY, accuracy: GEOMETRY } } })
      .run(conn);
    const before = await r.table("entities").orderBy("id").run(conn);
    await nestGeocodingAccuracyJob(conn);
    expect(await r.table("entities").orderBy("id").run(conn)).toEqual(before);
  });

  it("does nothing while the settings do not name both Concepts", async () => {
    await r
      .table("settings")
      .get("geocoding")
      .replace({ id: "geocoding", value: { roles: { geometry: GEOMETRY } } })
      .run(conn);
    const before = await r.table("entities").orderBy("id").run(conn);
    await nestGeocodingAccuracyJob(conn);
    expect(await r.table("entities").orderBy("id").run(conn)).toEqual(before);
  });
});

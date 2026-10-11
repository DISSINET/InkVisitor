import { Connection, r } from "rethinkdb-ts";
import { connectAdmin, getTestDbName } from "./db";
import migrateGeocodingGeometryJob from "../../../database/scripts/jobs/migrate-geocoding-geometry";

/**
 * The geo:x / geo:y → geo:geometry migration against a real RethinkDB, so the
 * filters, inserts and the reference scan run in the database and not in a stub.
 */

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const X = uuid(1);
const Y = uuid(2);
const ACCURACY = uuid(3);
const GEOMETRY = uuid(4);

const prop = (n: number, type: string, value: string) => ({
  id: uuid(n),
  type: { entityId: type },
  value: { entityId: value },
  children: [],
});
const value = (n: number, label: string) => ({ id: uuid(n), class: "V", labels: [label], props: [] });

let conn: Connection;

const location = async (id: string): Promise<any> => r.table("entities").get(id).run(conn);
const geometryOf = async (loc: any): Promise<any> => {
  const geometryProps = loc.props.filter((p: any) => p.type.entityId === GEOMETRY);
  expect(geometryProps).toHaveLength(1);
  const stored: any = await r.table("entities").get(geometryProps[0].value.entityId).run(conn);
  return JSON.parse(stored.labels[0]);
};

beforeAll(async () => {
  conn = await connectAdmin();
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
    .insert({ id: "geocoding", value: { roles: { x: X, y: Y, accuracy: ACCURACY } } })
    .run(conn);
  await r
    .table("entities")
    .insert([
      { id: X, class: "C", labels: ["geo:x"], props: [] },
      { id: Y, class: "C", labels: ["geo:y"], props: [] },
      // already created by an earlier, partly applied run; the settings do not name it yet
      { id: GEOMETRY, class: "C", labels: ["geo:geometry"], props: [] },
      value(10, "10.5"),
      value(11, "50.25"),
      value(12, "11,5"),
      value(13, "51,25"),
      value(14, "garbage"),
      value(15, "52"),
      value(16, "12"),
      value(17, "53"),
      value(18, "13"),
      value(19, "54"),
      value(20, '{"type":"Point","coordinates":[1,2]}'),
      { id: uuid(30), class: "L", labels: ["plain"], props: [prop(40, X, uuid(10)), prop(41, Y, uuid(11)), prop(42, ACCURACY, uuid(99))] },
      { id: uuid(31), class: "L", labels: ["comma"], props: [prop(43, X, uuid(12)), prop(44, Y, uuid(13))] },
      { id: uuid(32), class: "L", labels: ["unreadable"], props: [prop(45, X, uuid(14)), prop(46, Y, uuid(15))] },
      { id: uuid(33), class: "L", labels: ["has geometry"], props: [prop(47, X, uuid(16)), prop(48, Y, uuid(17)), prop(49, GEOMETRY, uuid(20))] },
      { id: uuid(34), class: "L", labels: ["shared values"], props: [prop(50, X, uuid(18)), prop(51, Y, uuid(19))] },
      { id: uuid(35), class: "S", labels: ["mentions a value"], props: [], data: { ref: uuid(18) } },
    ])
    .run(conn);
});

describe("migrate-geocoding-geometry", () => {
  it("turns x/y into one Point geometry Value and keeps the other props", async () => {
    await migrateGeocodingGeometryJob(conn);

    const plain = await location(uuid(30));
    expect(plain.props.map((p: any) => p.type.entityId).sort()).toEqual([ACCURACY, GEOMETRY].sort());
    expect(await geometryOf(plain)).toEqual({ type: "Point", coordinates: [10.5, 50.25] });
  });

  it("reads decimal commas", async () => {
    await migrateGeocodingGeometryJob(conn);
    expect(await geometryOf(await location(uuid(31)))).toEqual({ type: "Point", coordinates: [11.5, 51.25] });
  });

  it("leaves a Location with an unreadable coordinate untouched", async () => {
    await migrateGeocodingGeometryJob(conn);
    const bad = await location(uuid(32));
    expect(bad.props.map((p: any) => p.type.entityId)).toEqual([X, Y]);
    expect(await r.table("entities").get(uuid(14)).run(conn)).toBeTruthy();
  });

  it("only drops x/y from a Location that already has a geometry", async () => {
    await migrateGeocodingGeometryJob(conn);
    const held = await location(uuid(33));
    expect(held.props.map((p: any) => p.type.entityId)).toEqual([GEOMETRY]);
    expect(await geometryOf(held)).toEqual({ type: "Point", coordinates: [1, 2] });
  });

  it("deletes the old Values unless another entity still mentions them", async () => {
    await migrateGeocodingGeometryJob(conn);
    expect(await r.table("entities").get(uuid(10)).run(conn)).toBeNull();
    expect(await r.table("entities").get(uuid(16)).run(conn)).toBeNull();
    // uuid(18) is named by another entity's data, uuid(19) is not
    expect(await r.table("entities").get(uuid(18)).run(conn)).toBeTruthy();
    expect(await r.table("entities").get(uuid(19)).run(conn)).toBeNull();
  });

  it("points the settings at the geometry Concept and removes x and y", async () => {
    await migrateGeocodingGeometryJob(conn);
    const roles = ((await r.table("settings").get("geocoding").run(conn)) as any).value.roles;
    expect(roles.x).toBeUndefined();
    expect(roles.y).toBeUndefined();
    expect(roles.accuracy).toBe(ACCURACY);
    expect(roles.geometry).toBe(GEOMETRY);
  });

  it("changes nothing on a second run", async () => {
    await migrateGeocodingGeometryJob(conn);
    const before = await r.table("entities").orderBy("id").run(conn);
    const settingsBefore = await r.table("settings").run(conn);
    await migrateGeocodingGeometryJob(conn);
    expect(await r.table("entities").orderBy("id").run(conn)).toEqual(before);
    expect(await r.table("settings").run(conn)).toEqual(settingsBefore);
  });
});

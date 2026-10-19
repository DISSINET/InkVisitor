import { Connection, r } from "rethinkdb-ts";
import { connectAdmin, getTestDbName } from "./db";
import migrateGeocodingPlaceTypesJob from "../../../database/scripts/jobs/migrate-geocoding-place-types";

/**
 * The geo:type → Classification migration against a real RethinkDB, so the
 * relation lookup through the entityIds index and the prop rewrite run in the
 * database and not in a stub.
 */

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const TYPE_ROLE = uuid(1);
const VILLAGE = uuid(2);
const CASTLE = uuid(3);
const GONE = uuid(4);

const prop = (n: number, type: string, value: string) => ({
  id: uuid(n),
  type: { entityId: type },
  value: { entityId: value },
  children: [],
});

let conn: Connection;

const classifications = async (locationId: string): Promise<string[]> =>
  (
    (await r
      .table("relations")
      .getAll(locationId, { index: "entityIds" })
      .filter({ type: "CLA" })
      .run(conn)) as any[]
  )
    .map((relation) => relation.entityIds[1])
    .sort();

const location = async (id: string): Promise<any> => r.table("entities").get(id).run(conn);

beforeAll(async () => {
  conn = await connectAdmin();
  conn.use(getTestDbName());
});

afterAll(async () => {
  await conn.close();
});

beforeEach(async () => {
  await r.table("entities").delete().run(conn);
  await r.table("relations").delete().run(conn);
  await r.table("settings").delete().run(conn);
  await r
    .table("settings")
    .insert({
      id: "geocoding",
      value: {
        roles: {
          geometry: uuid(9),
          accuracy: uuid(8),
          type: TYPE_ROLE,
          placeTypes: { settlement: VILLAGE, fortress: CASTLE },
        },
      },
    })
    .run(conn);
  await r
    .table("entities")
    .insert([
      { id: TYPE_ROLE, class: "C", labels: ["geo:type"], props: [] },
      { id: VILLAGE, class: "C", labels: ["village"], props: [] },
      { id: CASTLE, class: "C", labels: ["castle"], props: [] },
      { id: uuid(20), class: "L", labels: ["plain"], props: [prop(40, TYPE_ROLE, VILLAGE), prop(41, uuid(8), uuid(7))] },
      { id: uuid(21), class: "L", labels: ["already"], props: [prop(42, TYPE_ROLE, CASTLE)] },
      { id: uuid(22), class: "L", labels: ["dangling"], props: [prop(43, TYPE_ROLE, GONE)] },
      { id: uuid(23), class: "L", labels: ["untouched"], props: [prop(44, uuid(8), uuid(7))] },
    ])
    .run(conn);
  await r
    .table("relations")
    .insert({ id: uuid(60), type: "CLA", entityIds: [uuid(21), CASTLE], order: 0 })
    .run(conn);
});

describe("migrate-geocoding-place-types", () => {
  it("turns the type prop into a Classification to the Concept it pointed at", async () => {
    await migrateGeocodingPlaceTypesJob(conn);
    expect(await classifications(uuid(20))).toEqual([VILLAGE]);
    const migrated = await location(uuid(20));
    expect(migrated.props.map((p: any) => p.type.entityId)).toEqual([uuid(8)]);
  });

  it("does not duplicate a Classification the Location already has", async () => {
    await migrateGeocodingPlaceTypesJob(conn);
    expect(await classifications(uuid(21))).toEqual([CASTLE]);
    expect((await location(uuid(21))).props).toEqual([]);
  });

  it("keeps the prop where its Concept no longer exists, and says so by keeping the role", async () => {
    await migrateGeocodingPlaceTypesJob(conn);
    expect(await classifications(uuid(22))).toEqual([]);
    expect((await location(uuid(22))).props).toHaveLength(1);
    const roles = ((await r.table("settings").get("geocoding").run(conn)) as any).value.roles;
    expect(roles.type).toBe(TYPE_ROLE);
  });

  it("leaves a Location that never had the prop alone", async () => {
    const before = await location(uuid(23));
    await migrateGeocodingPlaceTypesJob(conn);
    expect(await location(uuid(23))).toEqual(before);
    expect(await classifications(uuid(23))).toEqual([]);
  });

  it("turns the settings' map into the list of kinds, carrying the Concepts", async () => {
    await migrateGeocodingPlaceTypesJob(conn);
    const roles = ((await r.table("settings").get("geocoding").run(conn)) as any).value.roles;
    expect(Array.isArray(roles.placeTypes)).toBe(true);
    expect(roles.placeTypes).toHaveLength(12);
    expect(roles.placeTypes.find((one: any) => one.id === "settlement").conceptId).toBe(VILLAGE);
    expect(roles.placeTypes.find((one: any) => one.id === "fortress").conceptId).toBe(CASTLE);
  });

  it("removes the type role once nothing depends on it", async () => {
    await r.table("entities").get(uuid(22)).delete().run(conn);
    await migrateGeocodingPlaceTypesJob(conn);
    const roles = ((await r.table("settings").get("geocoding").run(conn)) as any).value.roles;
    expect("type" in roles).toBe(false);
  });

  it("changes nothing on a second run", async () => {
    await r.table("entities").get(uuid(22)).delete().run(conn);
    await migrateGeocodingPlaceTypesJob(conn);
    const entities = await r.table("entities").orderBy("id").run(conn);
    const relations = await r.table("relations").orderBy("id").run(conn);
    const settings = await r.table("settings").run(conn);
    await migrateGeocodingPlaceTypesJob(conn);
    expect(await r.table("entities").orderBy("id").run(conn)).toEqual(entities);
    expect(await r.table("relations").orderBy("id").run(conn)).toEqual(relations);
    expect(await r.table("settings").run(conn)).toEqual(settings);
  });
});

import { pointGeometry, serializeGeometry } from "@inkvisitor/shared/types/geometry";
import { Connection, r } from "rethinkdb-ts";
import { v4 as uuidv4 } from "uuid";

const SETTINGS_KEY = "geocoding";
const GEOMETRY_LABEL = "geo:geometry";

/**
 * A coordinate Value's label as a number, or null where it is blank, not a
 * number or outside the earth's range.
 */
const readCoordinate = (label: unknown, limit: number): number | null => {
  // a decimal comma is a number written the way many of the sources write it
  const text = String(label ?? "").trim().replace(",", ".");
  const parsed = Number(text);
  return text !== "" && Number.isFinite(parsed) && Math.abs(parsed) <= limit ? parsed : null;
};

/**
 * Moves every Location's `geo:x` and `geo:y` props into one `geo:geometry` prop
 * whose Value entity holds a GeoJSON Point, and points the project's geocoding
 * settings at the new Concept.
 *
 * A Location whose longitude or latitude cannot be read keeps its props and is
 * listed, so the raw text is still there to be corrected by hand. A Location
 * that already carries a geometry prop only loses its x and y props. The old
 * coordinate Value entities are deleted unless some other entity still mentions
 * them. The
 * `geo:x` and `geo:y` Concepts themselves are left in place.
 */
const migrateGeocodingGeometryJob = async (db: Connection): Promise<void> => {
  const settings: any = await r.table("settings").get(SETTINGS_KEY).run(db);
  const roles = settings?.value?.roles;
  if (!roles) {
    console.log("No geocoding settings row — nothing to migrate.");
    return;
  }
  const xId: string | undefined = roles.x || undefined;
  const yId: string | undefined = roles.y || undefined;
  if (!xId && !yId) {
    console.log(`The geocoding roles carry no x/y Concept (geometry: ${roles.geometry || "unset"}).`);
    return;
  }

  // the Concept every migrated Location will point at
  let geometryConceptId: string | undefined = roles.geometry || undefined;
  if (!geometryConceptId) {
    const existing: any[] = await r
      .table("entities")
      .filter((entity: any) =>
        entity("class").eq("C").and(entity("labels").contains(GEOMETRY_LABEL)),
      )
      .run(db);
    if (existing.length) {
      geometryConceptId = existing[0].id;
      console.log(`Using the existing ${GEOMETRY_LABEL} Concept ${geometryConceptId}`);
    } else {
      const template: any = await r.table("entities").get((xId || yId) as string).run(db);
      geometryConceptId = uuidv4();
      await r
        .table("entities")
        .insert({
          ...(template || {}),
          id: geometryConceptId,
          labels: [GEOMETRY_LABEL],
          createdAt: new Date(),
          legacyId: "",
        })
        .run(db);
      console.log(`Created the ${GEOMETRY_LABEL} Concept ${geometryConceptId}`);
    }
  }

  const coordinateTypes = [xId, yId].filter((id): id is string => !!id);
  const locations: any[] = await r
    .table("entities")
    .filter((entity: any) =>
      entity("class")
        .eq("L")
        .and(
          entity("props")
            .default([])
            .contains((prop: any) => r.expr(coordinateTypes).contains(prop("type")("entityId"))),
        ),
    )
    .run(db);
  console.log(`${locations.length} Location(s) carry geo:x or geo:y`);

  const oldValueIds = new Set<string>();
  const touched = new Set<string>();
  let migrated = 0;
  let dropped = 0;

  const unreadable: string[] = [];

  for (const location of locations) {
    const props: any[] = location.props || [];
    const xProps = props.filter((prop) => prop.type?.entityId === xId);
    const yProps = props.filter((prop) => prop.type?.entityId === yId);
    const xProp = xProps[0];
    const yProp = yProps[0];
    const hasGeometry = props.some((prop) => prop.type?.entityId === geometryConceptId);

    const [xValue, yValue]: any[] = await Promise.all(
      [xProp, yProp].map((prop) =>
        prop?.value?.entityId ? r.table("entities").get(prop.value.entityId).run(db) : null,
      ),
    );
    const lon = readCoordinate(xValue?.labels?.[0], 180);
    const lat = readCoordinate(yValue?.labels?.[0], 90);

    const rest = props.filter(
      (prop) => prop.type?.entityId !== xId && prop.type?.entityId !== yId,
    );
    const retired = [...xProps, ...yProps];

    if (!hasGeometry && (lon === null || lat === null)) {
      unreadable.push(`${location.id} (${location.labels?.[0]})`);
      continue;
    }

    for (const prop of retired) {
      if (prop.value?.entityId) {
        oldValueIds.add(prop.value.entityId);
      }
    }
    touched.add(location.id);

    if (hasGeometry) {
      await r.table("entities").get(location.id).update({ props: rest }).run(db);
      dropped++;
      continue;
    }

    const value = {
      ...xValue,
      id: uuidv4(),
      labels: [serializeGeometry(pointGeometry(lon as number, lat as number))],
      createdAt: new Date(),
    };
    await r.table("entities").insert(value).run(db);
    const geometryProp = {
      ...xProp,
      id: uuidv4(),
      type: { ...xProp.type, entityId: geometryConceptId },
      value: { ...xProp.value, entityId: value.id },
      children: [],
    };
    await r
      .table("entities")
      .get(location.id)
      .update({ props: [...rest, geometryProp] })
      .run(db);
    migrated++;
  }
  console.log(
    `Migrated ${migrated} Location(s); ${dropped} already had a geometry and only lost x/y`,
  );
  if (unreadable.length) {
    console.log(
      `${unreadable.length} Location(s) have an unreadable coordinate and were left untouched:\n  ${unreadable.join("\n  ")}`,
    );
  }

  // the old Values go unless something outside the migrated Locations mentions them
  const stillUsed = new Set<string>();
  if (oldValueIds.size) {
    const cursor = await r.table("entities").getCursor(db);
    const pattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
    for await (const entity of cursor as AsyncIterable<any>) {
      if (oldValueIds.has(entity.id)) {
        continue;
      }
      // a migrated Location no longer points at its own old Values
      const text = JSON.stringify(
        touched.has(entity.id)
          ? {
              ...entity,
              props: (entity.props || []).filter(
                (prop: any) => !oldValueIds.has(prop.value?.entityId),
              ),
            }
          : entity,
      );
      for (const found of text.match(pattern) || []) {
        if (oldValueIds.has(found)) {
          stillUsed.add(found);
        }
      }
    }
    const removable = [...oldValueIds].filter((id) => !stillUsed.has(id));
    if (removable.length) {
      await r.table("entities").getAll(...removable).delete().run(db);
    }
    console.log(
      `Deleted ${removable.length} old coordinate Value(s); kept ${stillUsed.size} still referenced elsewhere`,
    );
  }

  const nextRoles = { ...roles, geometry: geometryConceptId };
  delete nextRoles.x;
  delete nextRoles.y;
  await r
    .table("settings")
    .get(SETTINGS_KEY)
    .replace({ ...settings, value: { ...settings.value, roles: nextRoles } })
    .run(db);
  console.log(`geocoding roles now use geometry ${geometryConceptId}; x and y removed`);
};

export default migrateGeocodingGeometryJob;

import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { normalizePlaceTypes } from "@inkvisitor/shared/types/geocoding";
import { Connection, r } from "rethinkdb-ts";
import { v4 as uuidv4 } from "uuid";

const SETTINGS_KEY = "geocoding";

/**
 * Moves each Location's kind of place from a `geo:type` metaproperty to a
 * Classification relation, and turns the settings' map of engine type → Concept
 * into the project's list of kinds.
 *
 * A Location's old prop pointed straight at the Concept that stood for its kind,
 * so the relation is Location → that Concept. A Location that already has the
 * relation only loses the prop. Every Location prop of the retired role is
 * removed once its relation exists, and the settings drop the role. The `geo:type`
 * Concept itself is left in place. Idempotent: a settings row with no `type` role
 * and a list already in place changes nothing.
 */
const migrateGeocodingPlaceTypesJob = async (db: Connection): Promise<void> => {
  const settings: any = await r.table("settings").get(SETTINGS_KEY).run(db);
  const roles = settings?.value?.roles;
  if (!roles) {
    console.log("No geocoding settings row — nothing to migrate.");
    return;
  }

  const typeRoleId: string | undefined = roles.type || undefined;
  let relationsCreated = 0;
  let propsRemoved = 0;
  const skipped: string[] = [];

  if (typeRoleId) {
    const locations: any[] = await r
      .table("entities")
      .filter((entity: any) =>
        entity("class")
          .eq("L")
          .and(
            entity("props")
              .default([])
              .contains((prop: any) => prop("type")("entityId").eq(typeRoleId)),
          ),
      )
      .run(db);
    console.log(`${locations.length} Location(s) carry the retired place type prop`);

    for (const location of locations) {
      const props: any[] = location.props || [];
      const typeProps = props.filter((prop) => prop.type?.entityId === typeRoleId);
      const conceptIds = Array.from(
        new Set(typeProps.map((prop) => prop.value?.entityId).filter((id): id is string => !!id)),
      );

      const missing: string[] = [];
      for (const conceptId of conceptIds) {
        const concept: any = await r.table("entities").get(conceptId).run(db);
        if (!concept) {
          missing.push(conceptId);
          continue;
        }
        const existing: any[] = await r
          .table("relations")
          .getAll(location.id, { index: "entityIds" })
          .filter({ type: RelationEnums.Type.Classification })
          .filter((relation: any) => relation("entityIds").nth(1).eq(conceptId))
          .run(db);
        if (!existing.length) {
          await r
            .table("relations")
            .insert({
              id: uuidv4(),
              type: RelationEnums.Type.Classification,
              entityIds: [location.id, conceptId],
              order: EntityEnums.Order.Last,
              certainty: "",
              to_import: null,
            })
            .run(db);
          relationsCreated++;
        }
      }

      // a prop whose Concept no longer exists has nothing to become, so it stays
      // for someone to look at rather than being dropped with its only record
      if (missing.length) {
        skipped.push(`${location.id} (${location.labels?.[0]}): ${missing.join(", ")}`);
      }
      const rest = props.filter(
        (prop) =>
          prop.type?.entityId !== typeRoleId || (prop.value?.entityId && missing.includes(prop.value.entityId)),
      );
      if (rest.length !== props.length) {
        await r.table("entities").get(location.id).update({ props: rest }).run(db);
        propsRemoved += props.length - rest.length;
      }
    }
    console.log(`Created ${relationsCreated} Classification(s); removed ${propsRemoved} prop(s)`);
    if (skipped.length) {
      console.log(
        `${skipped.length} Location(s) pointed at a Concept that no longer exists and kept that prop:\n  ${skipped.join("\n  ")}`,
      );
    }
  }

  const nextRoles = { ...roles, placeTypes: normalizePlaceTypes(roles.placeTypes) };
  // the role stays while any prop still uses it, so a rerun can finish the work
  if (!skipped.length) {
    delete nextRoles.type;
  }
  await r
    .table("settings")
    .get(SETTINGS_KEY)
    .replace({ ...settings, value: { ...settings.value, roles: nextRoles } })
    .run(db);
  console.log(
    `geocoding settings now hold ${nextRoles.placeTypes.length} kind(s) of place${nextRoles.type ? "; the type role is kept for the props left" : "; the type role is removed"}`,
  );
};

export default migrateGeocodingPlaceTypesJob;

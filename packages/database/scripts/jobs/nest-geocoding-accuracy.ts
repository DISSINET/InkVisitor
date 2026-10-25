import { rolesShareAConcept } from "@inkvisitor/shared/types/geocoding";
import { Connection, r } from "rethinkdb-ts";
import { updatePropsIfUnchanged } from "./update-props-if-unchanged";

const SETTINGS_KEY = "geocoding";

export type NestOutcome = "moved" | "dropped the repeat" | { left: string };

/**
 * Moves one Location's accuracy prop from beside its geometry prop to under it.
 *
 * Left alone, with the reason, where the move would lose or hide something: the
 * Location has several geometry props or several accuracy props, an accuracy
 * under the geometry that differs from the one beside it, an accuracy prop whose
 * own children have children (moved down a level they would sit on a fourth,
 * which nothing shows), or props that changed since they were read.
 */
export const nestAccuracyOf = async (
  db: Connection,
  location: any,
  geometryType: string,
  accuracyType: string,
): Promise<NestOutcome> => {
  const props: any[] = location.props || [];
  const geometryProps = props.filter((prop) => prop.type?.entityId === geometryType);
  const accuracyProps = props.filter((prop) => prop.type?.entityId === accuracyType);

  if (geometryProps.length !== 1 || accuracyProps.length !== 1) {
    return {
      left: `${geometryProps.length} geometry prop(s) and ${accuracyProps.length} accuracy prop(s) beside each other`,
    };
  }
  const [geometryProp] = geometryProps;
  const [accuracyProp] = accuracyProps;
  const children: any[] = geometryProp.children || [];
  const under = children.find((child) => child.type?.entityId === accuracyType);

  if (under && under.value?.entityId !== accuracyProp.value?.entityId) {
    return { left: "the accuracy under the geometry differs from the one beside it" };
  }
  if (!under && (accuracyProp.children || []).some((child: any) => (child.children || []).length)) {
    return { left: "the accuracy prop has children that have children of their own" };
  }

  const nextGeometry = under
    ? geometryProp
    : { ...geometryProp, children: [...children, accuracyProp] };
  const replaced = await updatePropsIfUnchanged(
    db,
    location.id,
    props,
    props
      .filter((prop) => prop !== accuracyProp)
      .map((prop) => (prop === geometryProp ? nextGeometry : prop)),
  );
  if (!replaced) {
    return { left: "its props changed while the job ran" };
  }
  return under ? "dropped the repeat" : "moved";
};

/**
 * Moves each geocoded Location's accuracy prop from beside its geometry prop to
 * under it, as a subproperty.
 *
 * The page used to write the accuracy as a second top-level prop. A Location
 * that `nestAccuracyOf` cannot move safely is left alone and listed. A second run
 * finds nothing to move. A database still holding coordinates as `geo:x` and
 * `geo:y` has no geometry props yet: run `migrateGeocodingGeometryJob` first, or
 * this job lists every Location and has to be run again.
 */
const nestGeocodingAccuracyJob = async (db: Connection): Promise<void> => {
  const settings: any = await r.table("settings").get(SETTINGS_KEY).run(db);
  const roles = settings?.value?.roles;
  const geometryType: string | undefined = roles?.geometry || undefined;
  const accuracyType: string | undefined = roles?.accuracy || undefined;
  if (!geometryType || !accuracyType) {
    console.log("The geocoding settings do not name the geometry and accuracy Concepts — nothing to migrate.");
    return;
  }
  if (rolesShareAConcept(roles)) {
    console.log("The geocoding settings give one Concept to two roles — nothing was changed.");
    return;
  }

  const locations: any[] = await r
    .table("entities")
    .filter((entity: any) =>
      entity("class")
        .eq("L")
        .and(
          entity("props")
            .default([])
            .contains((prop: any) => prop("type")("entityId").eq(accuracyType)),
        ),
    )
    .run(db);
  console.log(`${locations.length} Location(s) carry an accuracy prop beside their other props`);

  let moved = 0;
  let droppedDuplicates = 0;
  const left: string[] = [];

  for (const location of locations) {
    const outcome = await nestAccuracyOf(db, location, geometryType, accuracyType);
    if (outcome === "moved") {
      moved++;
    } else if (outcome === "dropped the repeat") {
      droppedDuplicates++;
    } else {
      left.push(`${location.id} (${location.labels?.[0]}): ${outcome.left}`);
    }
  }

  console.log(
    `Moved the accuracy under the geometry on ${moved} Location(s); removed the repeated accuracy beside it on ${droppedDuplicates}`,
  );
  if (left.length) {
    console.log(`${left.length} Location(s) were left untouched:\n  ${left.join("\n  ")}`);
  }
};

export default nestGeocodingAccuracyJob;

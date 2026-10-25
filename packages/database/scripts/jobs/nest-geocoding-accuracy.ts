import { Connection, r } from "rethinkdb-ts";

const SETTINGS_KEY = "geocoding";

/**
 * Moves each geocoded Location's accuracy prop from beside its geometry prop to
 * under it, as a subproperty.
 *
 * The page used to write the accuracy as a second top-level prop. A Location is
 * left alone, and listed, where the move would lose something: it has several
 * geometry props or several accuracy props, or an accuracy under the geometry
 * that differs from the one beside it. A Location with an accuracy and no
 * geometry is also left alone, since there is nothing to put it under. A second
 * run finds nothing to move.
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
    const props: any[] = location.props || [];
    const geometryProps = props.filter((prop) => prop.type?.entityId === geometryType);
    const accuracyProps = props.filter((prop) => prop.type?.entityId === accuracyType);
    const name = `${location.id} (${location.labels?.[0]})`;

    if (geometryProps.length !== 1 || accuracyProps.length !== 1) {
      left.push(
        `${name}: ${geometryProps.length} geometry prop(s) and ${accuracyProps.length} accuracy prop(s) beside each other`,
      );
      continue;
    }
    const [geometryProp] = geometryProps;
    const [accuracyProp] = accuracyProps;
    const children: any[] = geometryProp.children || [];
    const under = children.find((child) => child.type?.entityId === accuracyType);

    if (under && under.value?.entityId !== accuracyProp.value?.entityId) {
      left.push(`${name}: the accuracy under the geometry differs from the one beside it`);
      continue;
    }

    const nextGeometry = under
      ? geometryProp
      : { ...geometryProp, children: [...children, accuracyProp] };
    await r
      .table("entities")
      .get(location.id)
      .update({
        props: props
          .filter((prop) => prop !== accuracyProp)
          .map((prop) => (prop === geometryProp ? nextGeometry : prop)),
      })
      .run(db);
    if (under) {
      droppedDuplicates++;
    } else {
      moved++;
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

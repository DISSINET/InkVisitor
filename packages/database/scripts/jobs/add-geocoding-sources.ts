import { rolesShareAConcept } from "@inkvisitor/shared/types/geocoding";
import { Connection, r } from "rethinkdb-ts";
import { v4 as uuidv4 } from "uuid";
import { updatePropsIfUnchanged } from "./update-props-if-unchanged";

const SETTINGS_KEY = "geocoding";

/**
 * Names the gazetteers one Location cites as subproperties of its geometry prop.
 *
 * Returns how many it added, or why the Location was left alone: it has no
 * geometry prop or several, or its props changed since they were read.
 */
export const nameSourcesOf = async (
  db: Connection,
  location: any,
  geometryType: string,
  sourceType: string,
  gazetteers: Set<string>,
): Promise<number | { left: string }> => {
  const props: any[] = location.props || [];
  const geometryProps = props.filter((prop) => prop.type?.entityId === geometryType);
  if (geometryProps.length !== 1) {
    return { left: `${geometryProps.length} geometry props` };
  }
  const [geometryProp] = geometryProps;
  const children: any[] = geometryProp.children || [];
  const named = new Set(
    children
      .filter((child) => child.type?.entityId === sourceType)
      .map((child) => child.value?.entityId),
  );
  const missing: string[] = [];
  for (const reference of location.references || []) {
    const resource: string | undefined = reference?.resource;
    if (resource && gazetteers.has(resource) && !named.has(resource) && !missing.includes(resource)) {
      missing.push(resource);
    }
  }
  if (!missing.length) {
    return 0;
  }

  // a new prop takes its levels of certainty, logic and the rest from the
  // geometry prop it hangs under, as every prop of one Location is read alike
  const sources = missing.map((resource) => ({
    ...geometryProp,
    id: uuidv4(),
    type: { ...geometryProp.type, entityId: sourceType },
    value: { ...geometryProp.value, entityId: resource },
    children: [],
  }));
  const replaced = await updatePropsIfUnchanged(
    db,
    location.id,
    props,
    props.map((prop) =>
      prop === geometryProp ? { ...geometryProp, children: [...children, ...sources] } : prop,
    ),
  );
  return replaced ? sources.length : { left: "its props changed while the job ran" };
};

/**
 * Names the gazetteers behind each geocoded Location's coordinate as
 * subproperties of its geometry prop, from the references it already carries.
 *
 * Every reference whose Resource is one of the project's gazetteer Resources
 * becomes one child of the geometry prop, typed with the epistemic source
 * Concept, once per Resource; a gazetteer the geometry already names is skipped.
 * A Location that `nameSourcesOf` cannot update is left alone and listed. A
 * second run finds nothing to add.
 */
const addGeocodingSourcesJob = async (db: Connection): Promise<void> => {
  const settings: any = await r.table("settings").get(SETTINGS_KEY).run(db);
  const roles = settings?.value?.roles;
  const geometryType: string | undefined = roles?.geometry || undefined;
  const sourceType: string | undefined = roles?.epistemicSource || undefined;
  const gazetteers = new Set<string>(Object.values(roles?.resources || {}));
  if (!geometryType || !sourceType || !gazetteers.size) {
    console.log(
      "The geocoding settings do not name the geometry Concept, the epistemic source Concept and the gazetteer Resources — nothing to add.",
    );
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
        .and(entity("references").default([]).count().gt(0))
        .and(
          entity("props")
            .default([])
            .contains((prop: any) => prop("type")("entityId").eq(geometryType)),
        ),
    )
    .run(db);
  console.log(`${locations.length} Location(s) have a geometry and references`);

  let updated = 0;
  let added = 0;
  const left: string[] = [];

  for (const location of locations) {
    const outcome = await nameSourcesOf(db, location, geometryType, sourceType, gazetteers);
    if (typeof outcome === "number") {
      if (outcome) {
        updated++;
        added += outcome;
      }
    } else {
      left.push(`${location.id} (${location.labels?.[0]}): ${outcome.left}`);
    }
  }

  console.log(`Named ${added} source(s) on ${updated} Location(s)`);
  if (left.length) {
    console.log(`${left.length} Location(s) were left untouched:\n  ${left.join("\n  ")}`);
  }
};

export default addGeocodingSourcesJob;

import { EntityEnums } from "@inkvisitor/shared/enums";
import { rolesShareAConcept } from "@inkvisitor/shared/types/geocoding";
import { Connection, r } from "rethinkdb-ts";
import { v4 as uuidv4 } from "uuid";
import { updatePropsIfUnchanged } from "./update-props-if-unchanged";

const SETTINGS_KEY = "geocoding";

/**
 * How far apart the Value entity holding a gazetteer's record id and the Value
 * holding the geometry can have been created for both to belong to one write.
 *
 * The page creates every Value of a write one after the other, so they are
 * seconds apart; a reference added by hand, or kept from an earlier geocode
 * while the coordinate was later moved, has its Value created at another time.
 */
const SAME_WRITE_MS = 5 * 60 * 1000;

/** The way a prop names an entity, with the levels the page gives it. */
const propSpec = (entityId: string) => ({
  entityId,
  elvl: EntityEnums.Elvl.Textual,
  logic: EntityEnums.Logic.Positive,
  virtuality: EntityEnums.Virtuality.Reality,
  partitivity: EntityEnums.Partitivity.Unison,
});

/** A source prop, with the levels the page gives every prop it writes. */
const sourceProp = (sourceType: string, resourceId: string) => ({
  id: uuidv4(),
  elvl: EntityEnums.Elvl.Textual,
  certainty: EntityEnums.Certainty.Empty,
  logic: EntityEnums.Logic.Positive,
  mood: [EntityEnums.Mood.Indication],
  moodvariant: EntityEnums.MoodVariant.Realis,
  bundleOperator: EntityEnums.Operator.And,
  bundleStart: false,
  bundleEnd: false,
  children: [],
  type: propSpec(sourceType),
  value: propSpec(resourceId),
});

/**
 * The gazetteers one Location cites for the coordinate it carries now.
 *
 * A reference outlives the coordinate it was written with: a Location geocoded
 * from GeoNames and then moved by a click keeps its GeoNames reference, and a
 * researcher can add a reference to Wikidata by hand. A gazetteer is the source
 * of the coordinate only where the Value holding its record id was created
 * together with the Value holding the geometry, as one write does; where either
 * Value has no creation time, nothing is credited.
 */
const gazetteersOfCurrentCoordinate = async (
  db: Connection,
  location: any,
  geometryValueId: string | undefined,
  gazetteers: Set<string>,
): Promise<string[]> => {
  const references: any[] = (location.references || []).filter(
    (reference: any) => reference?.resource && gazetteers.has(reference.resource) && reference.value,
  );
  if (!geometryValueId || !references.length) {
    return [];
  }
  const ids = [...new Set<string>([geometryValueId, ...references.map((one) => one.value)])];
  const found: any[] = await r.table("entities").getAll(...ids).pluck("id", "createdAt").run(db);
  const createdAt = new Map<string, number>(
    found
      .filter((one) => one.createdAt)
      .map((one): [string, number] => [one.id, new Date(one.createdAt).getTime()]),
  );
  const geometryAt = createdAt.get(geometryValueId);
  if (geometryAt === undefined) {
    return [];
  }
  const credited: string[] = [];
  for (const reference of references) {
    const at = createdAt.get(reference.value);
    if (
      at !== undefined &&
      Math.abs(at - geometryAt) <= SAME_WRITE_MS &&
      !credited.includes(reference.resource)
    ) {
      credited.push(reference.resource);
    }
  }
  return credited;
};

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
  const missing = (
    await gazetteersOfCurrentCoordinate(db, location, geometryProp.value?.entityId, gazetteers)
  ).filter((resource) => !named.has(resource));
  if (!missing.length) {
    return 0;
  }

  const sources = missing.map((resource) => sourceProp(sourceType, resource));
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
 * and whose record id was written together with the Location's current geometry
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

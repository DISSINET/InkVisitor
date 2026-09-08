import Entity from "@models/entity/entity";
import Relation from "@models/relation/relation";
import Resource from "@models/resource/resource";
import Value from "@models/value/value";
import { Db } from "@service/rethink";
import { DbEnums, EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import {
  IAction,
  IConcept,
  IReference,
  IResource,
  IValue,
  IEntity,
  IProp,
  Relation as RelationTypes,
  AuditScope,
} from "@inkvisitor/shared/types";
import * as path from "path";
import { Connection, r as rethink } from "rethinkdb-ts";
import { question } from "scripts/import/prompts";
import { v4 as uuidv4 } from "uuid";
import { IJob } from ".";
import Generator from "./Generator";
import Audit from "@models/audit/audit";
import fs from "fs";
import {
  collectStats,
  DroppedProp,
  EndpointState,
  firstLabel,
  renderConsole,
  renderMarkdown,
  walkProps,
} from "./dataset-stats";

export async function getEntitiesDataByClass<T>(
  db: Connection,
  entityClass: EntityEnums.Class
): Promise<T[]> {
  const connection = db instanceof Db ? db.connection : db;
  return rethink
    .table(Entity.table)
    .getAll(entityClass, { index: DbEnums.Indexes.Class })
    .run(connection);
}

// getAll is called with one argument per entity id; RethinkDB rejects a query
// built from the whole id list at once, so the ids are queried in batches
const RELATION_QUERY_BATCH = 500;

async function getRelationsWithEntities<T extends RelationTypes.IRelation>(
  db: Connection,
  entityIds: string[],
  relType?: RelationEnums.Type,
  position?: number
): Promise<T[]> {
  // getAll takes one argument per id, so a whole-database id list has to go in
  // batches; a relation is returned once per matching entityId and is keyed by
  // its own id to collapse those repeats
  const byId: Record<string, T> = {};
  for (let i = 0; i < entityIds.length; i += RELATION_QUERY_BATCH) {
    const batch = entityIds.slice(i, i + RELATION_QUERY_BATCH);
    const found: T[] = await rethink
      .table(Relation.table)
      .getAll.call(undefined, ...batch, {
        index: DbEnums.Indexes.RelationsEntityIds,
      })
      .filter(relType ? { type: relType } : {})
      .run(db);

    for (const relation of found) {
      byId[relation.id] = relation;
    }
  }
  const items: T[] = Object.values(byId);

  if (position !== undefined) {
    return items.filter((d) => entityIds.indexOf(d.entityIds[position]) !== -1);
  }
  return items;
}

async function getEntitiesByIds(
  db: Connection,
  entityIds: string[]
): Promise<IEntity[]> {
  const out: IEntity[] = [];
  for (let i = 0; i < entityIds.length; i += RELATION_QUERY_BATCH) {
    const batch = entityIds.slice(i, i + RELATION_QUERY_BATCH);
    if (!batch.length) {
      continue;
    }
    const found: IEntity[] = await rethink
      .table(Entity.table)
      .getAll(...batch)
      .run(db);
    out.push(...found);
  }
  return out;
}

// each exported entity should have referene to this Resoure, which point to original dissinet source
const originResource = new Resource({
  id: "dissinet-resource",
  data: {
    partValueBaseURL: "",
    partValueLabel: "",
    url: "https://dissinet.cz/",
  },
  labels: ["DISSINET Database (DDB1)"],
  language: EntityEnums.Language.English,
  notes: [],
  status: EntityEnums.Status.Approved,
});

class ACRGenerator extends Generator {
  getPath(filename?: string) {
    if (!this.datasetName) {
      throw new Error(
        "Dataset name not yet set, cannot create the path to directory"
      );
    }

    let parts = [__dirname, "..", "..", Generator.DIRECTORY, this.datasetName];
    if (filename) {
      parts.push(filename);
    }
    return path.join.apply(undefined, parts);
  }

  async getUserInfo() {
    const datasetName = await question<string>(
      "Name of the dataset?",
      (input: string): string => input,
      ""
    );

    console.log("Dataset name:", datasetName);
    if (!datasetName) {
      throw new Error("Dataset name should not be empty");
    }
    this.datasetName = datasetName;

    const datasetPath = this.getPath();
    // if (fs.existsSync(datasetPath)) {
    //   throw new Error(`The dataset path (${datasetPath}) already exists`);
    // }
  }
}

const exportACR: IJob = async (db: Connection): Promise<void> => {
  const generator = new ACRGenerator();
  await generator.getUserInfo();

  const values: IValue[] = [];
  const existingReferenceValueIds: string[] = [];

  const acResourceIds: string[] = [];

  // retrieve all actions and push origin resource into list of references
  // +
  // replace original label with the id
  const actions = (
    await getEntitiesDataByClass<IAction>(db, EntityEnums.Class.Action)
  ).map((a) => {
    a.references.forEach((r) => {
      existingReferenceValueIds.push(r.value);

      if (!acResourceIds.includes(r.resource) && r.resource) {
        acResourceIds.push(r.resource);
      }
    });

    const v = new Value({
      id: uuidv4(),
      labels: [a.id],
    });
    values.push(v);

    a.references.push({
      id: uuidv4(),
      resource: originResource.id,
      value: v.id,
    } as IReference);

    return a;
  });

  // retrieve all concepts and push origin resource into list of references
  // +
  // replace original label with the id
  const concepts = (
    await getEntitiesDataByClass<IConcept>(db, EntityEnums.Class.Concept)
  ).map((c) => {
    c.references.forEach((r) => {
      existingReferenceValueIds.push(r.value);
      if (!acResourceIds.includes(r.resource) && r.resource) {
        acResourceIds.push(r.resource);
      }
    });

    // metaprops
    c.props.forEach((p) => {});

    const v = new Value({
      id: uuidv4(),
      labels: [c.id],
    });
    values.push(v);
    c.references.push({
      id: uuidv4(),
      resource: originResource.id,
      value: v.id,
    } as IReference);
    return c;
  });

  // retrieve all resources
  const allResources = await getEntitiesDataByClass<IResource>(
    db,
    EntityEnums.Class.Resource
  );

  // A Resource cited by an A/C can sit anywhere in a superordinate-entity
  // chain (English WordNet 3.1 Sense Keys under WordNet, CIDOC-CRMsoc under
  // CIDOC-CRM), and the chain is what gives the exported references their
  // hierarchy, so the walk continues until it reaches the top of every chain
  // rather than stopping one level up.
  const resourceIds = new Set(
    allResources.filter((r) => acResourceIds.includes(r.id)).map((r) => r.id)
  );

  let frontier = [...resourceIds];
  while (frontier.length) {
    const soeRelations = (
      await getRelationsWithEntities(
        db,
        frontier,
        RelationEnums.Type.SuperordinateEntity
      )
    ).flatMap((rel) => rel.entityIds);

    frontier = [...new Set(soeRelations)].filter(
      (entityId) => entityId && !resourceIds.has(entityId)
    );
    frontier.forEach((entityId) => resourceIds.add(entityId));
  }

  const resources = allResources
    .filter((r) => resourceIds.has(r.id))
    .map((r) => {
      r.references.forEach((reference) => {
        existingReferenceValueIds.push(reference.value);
      });

      const v = new Value({
        id: uuidv4(),
        labels: [r.id],
      });

      values.push(v);
      r.references.push({
        id: uuidv4(),
        resource: originResource.id,
        value: v.id,
      } as IReference);

      return r;
    });

  // get all Reference Values from existingReferenceValueIds and merge into values
  // Every Value is its own entity and none are merged here: the ids collected
  // above repeat whenever several references cite the same Value, and getAll
  // returns one row per argument, so the repeats are copies of a single Value
  // sharing one id rather than distinct Values.
  const referenceValueIds = [...new Set(existingReferenceValueIds)];
  const existingReferenceValues = referenceValueIds.length
    ? await rethink.table(Value.table).getAll(...referenceValueIds).run(db)
    : [];

  const exportedValueIds = new Set(values.map((v) => v.id));
  for (const value of existingReferenceValues) {
    if (!exportedValueIds.has(value.id)) {
      exportedValueIds.add(value.id);
      values.push(value);
    }
  }

  // allow only relations, which have all entities in lists above
  const allEntities: (IAction | IConcept | IResource | IValue)[] = [];
  actions.forEach((a) => allEntities.push(a));
  concepts.forEach((c) => allEntities.push(c));
  resources.forEach((r) => allEntities.push(r));
  values.forEach((v) => allEntities.push(v));

  const allIds = allEntities.map((a) => a.id);
  const allIdSet = new Set(allIds);

  // A metaprop survives only when both of its endpoints are exported, and the
  // rule applies at every level of the prop tree - a child prop pointing out of
  // the dataset would break it just as a top-level one would. Each drop is
  // recorded: an endpoint of an unexported class is the scope working as
  // intended, while an endpoint absent from the database is a fault in the
  // source data, and only the endpoint lookup below tells the two apart.
  const droppedProps: DroppedProp[] = [];
  const droppedEndpointIds = new Set<string>();

  const filterProps = (
    carrier: IAction | IConcept,
    props: IProp[]
  ): IProp[] =>
    props
      .filter((prop) => {
        if (
          allIdSet.has(prop.type.entityId) &&
          allIdSet.has(prop.value.entityId)
        ) {
          return true;
        }

        droppedEndpointIds.add(prop.type.entityId);
        droppedEndpointIds.add(prop.value.entityId);
        droppedProps.push({
          carrierId: carrier.id,
          carrierClass: carrier.class,
          carrierLabel: firstLabel(carrier),
          propId: prop.id,
          typeId: prop.type.entityId,
          typeClass: "",
          typeLabel: "",
          typeState: "present",
          valueId: prop.value.entityId,
          valueClass: "",
          valueLabel: "",
          valueState: "present",
        });
        return false;
      })
      .map((prop) => ({
        ...prop,
        children: filterProps(carrier, prop.children ?? []),
      }));

  concepts.forEach((c) => {
    c.props = filterProps(c, c.props ?? []);
  });
  actions.forEach((a) => {
    a.props = filterProps(a, a.props ?? []);
  });

  // name the endpoints of the dropped props so the warning in summary.md can
  // be acted on, and so an endpoint that no longer exists is reported as such
  const endpoints = await getEntitiesByIds(
    db,
    [...droppedEndpointIds].filter(Boolean)
  );
  const endpointById = new Map(endpoints.map((e) => [e.id, e]));
  const endpointState = (id: string): EndpointState => {
    if (allIdSet.has(id)) {
      return "present";
    }
    if (!id) {
      return "unfinished";
    }
    return endpointById.has(id) ? "outOfScope" : "absent";
  };

  for (const dropped of droppedProps) {
    const type = endpointById.get(dropped.typeId);
    const value = endpointById.get(dropped.valueId);
    dropped.typeClass = type?.class ?? "";
    dropped.typeLabel = firstLabel(type);
    dropped.typeState = endpointState(dropped.typeId);
    dropped.valueClass = value?.class ?? "";
    dropped.valueLabel = firstLabel(value);
    dropped.valueState = endpointState(dropped.valueId);
  }

  // a relation survives only when every entity it connects is exported, so that
  // the dataset stays import-ready on a deploy that holds nothing else
  const relations = (await getRelationsWithEntities(db, allIds)).filter((r) =>
    r.entityIds.every((entityId) => allIdSet.has(entityId))
  );

  generator.entities.entities.A = actions;
  generator.entities.entities.C = concepts;
  generator.entities.entities.V = values;
  generator.entities.entities.R = [originResource, ...resources];

  // get all audits and filter only relevant entities there, remove the change
  const auditsAll: Audit[] = await rethink.table("audits").run(db);

  const audits = auditsAll
    .filter(
      (a) => a.auditScope === AuditScope.Entity && allIdSet.has(a.modelId)
    )
    .map((a) => {
      a.changes = {};
      return a;
    });

  generator.relations.relations = Object.values(RelationEnums.Type).reduce(
    (acc, type) => {
      acc[type] = relations.filter((r) => r.type === type);
      return acc;
    },
    {} as Record<RelationEnums.Type, RelationTypes.IRelation[]>
  );

  await generator.output();
  fs.writeFileSync(
    generator.getPath("audits.json"),
    JSON.stringify(audits, null, 4)
  );

  const exportedEntities = Object.values(generator.entities.entities).flat() as (
    | IAction
    | IConcept
    | IResource
    | IValue
  )[];
  const users = (await rethink
    .table("users")
    .pluck("id", "name")
    .run(db)) as { id: string; name: string }[];
  const userNames = users.reduce((acc, user) => {
    acc[user.id] = user.name;
    return acc;
  }, {} as Record<string, string>);

  const stats = collectStats({
    entities: exportedEntities,
    relations,
    audits,
    userNames,
    droppedProps,
  });

  console.log(renderConsole(stats));
  fs.writeFileSync(
    generator.getPath("summary.md"),
    renderMarkdown(stats, {
      name: `A-C-R export "${generator.datasetName}"`,
      source: (db as unknown as { db?: string }).db,
    })
  );

  if (stats.problems.length) {
    throw new Error(
      `the export is not import-ready: ${stats.problems.length} problem(s) listed above, details in summary.md; do not publish these files`
    );
  }
};

export default exportACR;

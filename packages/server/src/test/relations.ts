import { getRelationClass } from "@models/factory";
import { RelationEnums } from "@inkvisitor/shared/enums";
import { Relation as RelationTypes } from "@inkvisitor/shared/types";
import { Connection } from "rethinkdb-ts";

/**
 * Saves one relation of the given type between two entities, for suites that
 * need a relation graph in the test database. The id is derived from the pair,
 * since a suite asserts on the entities a walk reaches, never on relation rows.
 *
 * Kept apart from fixtures.ts: that module is loaded by globalSetup, which runs
 * outside jest's module mapper and so cannot resolve model imports.
 * @param conn db connection
 * @param type relation type
 * @param entityIds the pair, in the order the relation type defines
 */
export const saveRelationFixture = async (
  conn: Connection,
  type: RelationEnums.Type,
  entityIds: [string, string]
): Promise<void> => {
  await getRelationClass({
    id: `fixture-${type}-${entityIds.join("-")}`,
    type,
    entityIds,
  } as RelationTypes.IRelation).save(conn);
};

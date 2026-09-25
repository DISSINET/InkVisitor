import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { ITerritory } from "@inkvisitor/shared/types";
import { quote } from "./helpers";
import { ImportEntity, ImportIssue } from "./types";

// An Editor may create a territory, but only an Owner or Admin may delete one,
// so the rollback could not undo territories an Editor imported.
const TERRITORY_IMPORT_ROLES = [UserEnums.Role.Owner, UserEnums.Role.Admin];

const parentIdOf = ({ entity }: ImportEntity): string | undefined => {
  if (entity.class !== EntityEnums.Class.Territory) {
    return undefined;
  }
  const parent = (entity as ITerritory).data.parent;
  return parent ? parent.territoryId : undefined;
};

/**
 * Checks the role and the parent chains of the imported territories, and
 * orders the entities for creation: a territory is saved into its parent, so
 * a parent from the input has to be created before its children.
 */
export const validateTerritories = (
  entities: ImportEntity[],
  role: UserEnums.Role
): { errors: ImportIssue[]; ordered: ImportEntity[] } => {
  const errors: ImportIssue[] = [];
  const territories = entities.filter(({ entity }) => entity.class === EntityEnums.Class.Territory);

  if (!TERRITORY_IMPORT_ROLES.includes(role)) {
    territories.forEach(({ index, entity }) =>
      errors.push({
        entityIndex: index,
        label: entity.labels[0],
        path: "class",
        message: "only admins can import territories",
      })
    );
  }

  const byId = new Map(entities.map((item) => [item.entity.id, item]));

  // a parent chain that returns to where it started never reaches an existing
  // territory; each loop is reported once, from the first member in the input
  const reportedLoopMembers = new Set<string>();
  for (const start of territories) {
    const chain: string[] = [start.entity.id];
    let parentId = parentIdOf(start);
    while (parentId && byId.has(parentId) && !chain.includes(parentId)) {
      chain.push(parentId);
      parentId = parentIdOf(byId.get(parentId)!);
    }
    if (parentId === start.entity.id && !reportedLoopMembers.has(start.entity.id)) {
      chain.forEach((id) => reportedLoopMembers.add(id));
      const labels = [...chain, start.entity.id].map((id) => quote(byId.get(id)!.entity.labels[0]));
      errors.push({
        entityIndex: start.index,
        label: start.entity.labels[0],
        path: "data.parent.territoryId",
        message: `territory parent loop: ${labels.join(" → ")}`,
      });
    }
  }

  const ordered: ImportEntity[] = [];
  const placed = new Set<string>();
  const place = (item: ImportEntity, visiting: Set<string>) => {
    if (placed.has(item.entity.id) || visiting.has(item.entity.id)) {
      return;
    }
    visiting.add(item.entity.id);
    const parent = byId.get(parentIdOf(item) ?? "");
    if (parent) {
      place(parent, visiting);
    }
    placed.add(item.entity.id);
    ordered.push(item);
  };
  entities.forEach((item) => place(item, new Set()));

  return { errors, ordered };
};

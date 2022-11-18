import { EntityEnums, RelationEnums } from "@shared/enums";
import { EntityTooltip, Relation as RelationTypes } from "@shared/types";
import { Connection } from "rethinkdb-ts";
import Relation from "./relation";

const MAX_NEST_LVL = 3;

/**
 * recursively search for action event trees
 * @param conn
 */
export const getActionEventNodes = async (
    conn: Connection,
    parentId: string,
    asClass: EntityEnums.Class,
    nestLvl: number = 0,
): Promise<EntityTooltip.ISuperclassTree> => {
    const out: EntityTooltip.ISuperclassTree = {
        entityId: parentId,
        subtrees: [],
    };

    let relations: RelationTypes.IRelation[] = [];

    switch (asClass) {
        case EntityEnums.Class.Action:
            relations = await Relation.getForEntity<RelationTypes.IActionEventEquivalent>(
                conn,
                parentId,
                RelationEnums.Type.ActionEventEquivalent,
                0
            );
            break;
        default:
            break;
    }

    // make unique and sorted list of ids
    const subrootIds = [
        ...new Set(relations.map((r) => r.entityIds[1])),
    ].sort();

    for (const subparentId of subrootIds) {
        out.subtrees.push(
            await getSuperclassTrees(
                conn,
                subparentId,
                EntityEnums.Class.Concept,
                nestLvl + 1,
            )
        );
    }

    return out;
};

/**
 * recursively search for superclass relations
 * @param conn
 */
export const getSuperclassTrees = async (
    conn: Connection,
    parentId: string,
    asClass: EntityEnums.Class,
    nestLvl: number = 0,
): Promise<EntityTooltip.ISuperclassTree> => {
    const out: EntityTooltip.ISuperclassTree = {
        entityId: parentId,
        subtrees: [],
    };

    if (nestLvl > MAX_NEST_LVL) {
        return out;
    }

    let relations: RelationTypes.IRelation[] = [];

    switch (asClass) {
        case EntityEnums.Class.Concept:
        case EntityEnums.Class.Action:
            relations = await Relation.getForEntity<RelationTypes.ISuperclass>(
                conn,
                parentId,
                RelationEnums.Type.Superclass,
                0
            );
            break;
        case EntityEnums.Class.Person:
        case EntityEnums.Class.Location:
        case EntityEnums.Class.Object:
        case EntityEnums.Class.Group:
        case EntityEnums.Class.Event:
        case EntityEnums.Class.Statement:
        case EntityEnums.Class.Territory:
        case EntityEnums.Class.Resource:
            relations = await Relation.getForEntity<RelationTypes.IClassification>(
                conn,
                parentId,
                RelationEnums.Type.Classification,
                0
            );
            break;
        default:
            break;
    }

    // make unique and sorted list of ids
    const subrootIds = [
        ...new Set(relations.map((r) => r.entityIds[1])),
    ].sort();

    for (const subparentId of subrootIds) {
        out.subtrees.push(
            await getSuperclassTrees(
                conn,
                subparentId,
                EntityEnums.Class.Concept,
                nestLvl + 1,
            )
        );
    }

    this.addLinkedEntities(subrootIds);

    return out;
};

/**
* returns synonym cloud in the form of list containing grouped entity ids
* @param conn
* @returns
*/
export const getSynonymCloud = async (
    conn: Connection,
    asClass: EntityEnums.Class,
    entityId: string
): Promise<EntityTooltip.ISynonymCloud | undefined> => {
    let out: EntityTooltip.ISynonymCloud | undefined;

    if (
        asClass === EntityEnums.Class.Concept ||
        asClass === EntityEnums.Class.Action
    ) {
        const synonyms = await Relation.getForEntity<RelationTypes.ISynonym>(
            conn,
            entityId,
            RelationEnums.Type.Synonym
        );

        out = synonyms.reduce(
            (acc, cur) => acc.concat(cur.entityIds),
            [] as string[]
        );
    }

    return out;
};



/**
 * returns synonym cloud in the form of list containing grouped entity ids
 * @param conn
 * @returns
 */
export const getIdentifications = async (
    conn: Connection,
    entityId: string
): Promise<EntityTooltip.IIdentification[]> => {
    const out: EntityTooltip.IIdentification[] = [];

    const identifications =
        await Relation.getForEntity<RelationTypes.IIdentification>(
            conn,
            entityId,
            RelationEnums.Type.Identification
        );

    for (const relation of identifications) {
        out.push({
            certainty: relation.certainty,
            entityId:
                relation.entityIds[0] === entityId
                    ? relation.entityIds[1]
                    : relation.entityIds[0],
        });
    }

    addLinkedEntities(out.map(o => o.entityId));

    return out;
};

/**
* recursively search for superordinate location relations
* @param conn
*/
export const getSuperordinateLocationTree = async (
    conn: Connection,
    asClass: EntityEnums.Class,
    parentId: string
): Promise<EntityTooltip.ISuperordinateLocationTree> => {
    const out: EntityTooltip.ISuperordinateLocationTree = {
        entityId: parentId,
        subtrees: [],
    };

    let locations: RelationTypes.ISuperordinateLocation[] = [];

    if (asClass === EntityEnums.Class.Location) {
        locations =
            await Relation.getForEntity<RelationTypes.ISuperordinateLocation>(
                conn,
                parentId,
                RelationEnums.Type.SuperordinateLocation,
                0
            );
    }

    // make unique and sorted list of ids
    const subrootIds = [
        ...new Set(locations.map((r) => r.entityIds[1])),
    ].sort();

    for (const subparentId of subrootIds) {
        out.subtrees.push(
            await getSuperordinateLocationTree(conn, asClass, subparentId)
        );
    }

    return out;
};

export const getEntityIdsFromTree = (tree: EntityTooltip.ISuperordinateLocationTree): string[] => {
    let out: string[] = [tree.entityId];

    for (const subtree of tree.subtrees) {
        out.push(...getEntityIdsFromTree(subtree));
    }

    return out;
};
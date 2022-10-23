import { RelationEnums } from "@shared/enums";
import { IRequest } from "src/custom_typings/request";
import Relation from "./relation";

interface PathTree {
    mainId: string;
    ids: string[];
}

export default class Path {
    type: RelationEnums.Type;
    trees: Record<string, PathTree>
    constructor(type: RelationEnums.Type) {
        this.type = type;
        this.trees = {};
    }

    async build(request: IRequest): Promise<void> {
        const entries = await Relation.getByType(request.db.connection, this.type);
        this.trees = {};
        for (const entry of entries) {
            this.trees[entry.entityIds[0]] = {
                mainId: entry.entityIds[0],
                ids: entry.entityIds,
            }
        }
    }

    /**
     * Tests if there exists path from entity A -> B through relations
     * @param a 
     * @param b 
     */
    pathExists(a: string, b: string): boolean {
        if (!this.trees[a]) {
            return false;
        }

        let start = [this.trees[a]]
        while (start.length) {
            const nextStart = [];
            for (const subtree of start) {
                for (const entityId of subtree.ids) {
                    if (entityId === b) {
                        return true;
                    }

                    // entry from 'entityId' -> X must exists to be added to nextStat
                    if (entityId !== subtree.mainId && this.trees[entityId]) {
                        nextStart.push(this.trees[entityId]);
                    }
                }
            }
            start = nextStart;
        }

        return false;
    }
}
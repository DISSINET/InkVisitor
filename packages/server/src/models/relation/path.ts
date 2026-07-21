import { RelationEnums } from "@inkvisitor/shared/enums";
import { IRelationModel } from "./relation";

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
    

    async build(entries: IRelationModel[]) {
        this.trees = {};
        for (const entry of entries.filter(e => e.type === this.type)) {
            this.addEntry(entry);
        }
    }

    /**
     * Records a single relation in the graph, so a caller saving relations in a
     * loop can keep one Path current rather than rebuilding it per insert.
     *
     * NOT additive: trees is keyed by the source id (entityIds[0]) and this
     * OVERWRITES whatever that key held. An entity with several outgoing
     * relations of this type therefore keeps only the last one recorded, which
     * leaves pathExists walking an incomplete graph - it can miss a path that
     * runs through a discarded edge. build() has the same behaviour, since it
     * is a loop over this method.
     */
    addEntry(entry: IRelationModel) {
        if (entry.type !== this.type) {
            return;
        }
        this.trees[entry.entityIds[0]] = {
            mainId: entry.entityIds[0],
            ids: entry.entityIds,
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
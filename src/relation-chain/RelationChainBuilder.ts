import RelationChain from "./RelationChain";
import IRelationChainNode from "./IRelationChainNode";
import RelationChainException from "../exception/RelationChainException";

type IRelationChainMap = { [key: string]: { [key: string]: IRelationChainNode } };

class RelationChainBuilder {
    private target: string = '';
    private completeRelationMap: IRelationChainMap = {};

    constructor(target: string, associationTables: string[], relations: string[]) {
        this.target = target.split('.')[0];
        let definedTables: string[] = [this.target, ...associationTables];
        for (const relation of relations) {
            const tableRelation: IRelationChainNode = this.extractRelation(relation);
            if (!definedTables.includes(tableRelation.fromTable) || !definedTables.includes(tableRelation.toTable)) {
                throw new RelationChainException(`${relation} using undefined table`);
            }
            this.safeMapAssign(this.completeRelationMap, tableRelation.fromTable, tableRelation.toTable, tableRelation);
            this.safeMapAssign(
                this.completeRelationMap,
                tableRelation.toTable,
                tableRelation.fromTable,
                {
                    fromTable: tableRelation.toTable,
                    fromField: tableRelation.toField,
                    toTable: tableRelation.fromTable,
                    toField: tableRelation.fromField
                });
        }
    }

    public build(): RelationChain {
        const forwardRelationMap: IRelationChainMap = {};
        const backwardRelationMap: IRelationChainMap = {};
        let trackingTable: string[] = [this.target];
        let visitedTable: string[] = [];
        const endNode: Set<string> = new Set();
        while (trackingTable.length !== 0) {
            const table: string = trackingTable.shift()!;
            const relation: { [key: string]: IRelationChainNode } = this.completeRelationMap[table];
            if (relation === undefined) {
                visitedTable.push(table);
                continue;
            }
            const descendants: string[] = Object.keys(relation);
            let hasNewDescendant = false;
            for (const descendant of descendants) {
                if (visitedTable.includes(descendant)) continue;
                hasNewDescendant = true;
                this.safeMapAssign(forwardRelationMap, table, descendant, relation[descendant]);
                trackingTable.push(descendant);
            }
            if (!hasNewDescendant) {
                endNode.add(table);
            }
            visitedTable.push(table);
        }
        trackingTable = [this.target];
        visitedTable = [];
        while (trackingTable.length !== 0) {
            const table: string = trackingTable.shift()!;
            const relation: { [key: string]: IRelationChainNode } = this.completeRelationMap[table];
            if (relation === undefined) {
                visitedTable.push(table);
                continue;
            }
            const descendants: string[] = Object.keys(relation);
            for (const descendant of descendants) {
                if (visitedTable.includes(descendant)) continue;
                this.safeMapAssign(backwardRelationMap, descendant, table, this.completeRelationMap[descendant][table]);
                trackingTable.push(descendant);
            }
            visitedTable.push(table);
        }
        return new RelationChain(forwardRelationMap, backwardRelationMap);
    }

    private safeMapAssign(map: any, key1: string, key2: string, value: any): void {
        if (map[key1] === undefined) map[key1] = {};
        map[key1][key2] = value;
    }

    private extractRelation(relation: string): IRelationChainNode {
        const side = relation.split('=');
        const left = side[0].split('.');
        const right = side[1].split('.');
        return {
            fromTable: left[0],
            fromField: left[1],
            toTable: right[0],
            toField: right[1]
        };
    }
}

export default RelationChainBuilder;
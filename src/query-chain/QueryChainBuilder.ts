import QueryChain from "./QueryChain";
import IQueryChainRelation from "./IQueryChainRelation";
import QueryChainException from "../exception/QueryChainException";

type IQueryChainRelationMap = { [key: string]: { [key: string]: IQueryChainRelation } };

class QueryChainBuilder {
    private target: string = '';
    private completeRelationMap: IQueryChainRelationMap = {};

    constructor(target: string, associationTables: string[], relations: string[]) {
        let definedTables: string[] = [target, ...associationTables];
        this.target = target;
        for (const relation of relations) {
            const tableRelation: IQueryChainRelation = this.extractRelation(relation);
            if (!definedTables.includes(tableRelation.fromTable) || !definedTables.includes(tableRelation.toTable)) {
                throw new QueryChainException(`${relation} using undefined table`);
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

    public build(): QueryChain {
        const forwardRelationMap: IQueryChainRelationMap = {};
        const backwardRelationMap: IQueryChainRelationMap = {};
        let trackingTable: string[] = [this.target];
        let visitedTable: string[] = [];
        const endNode: Set<string> = new Set();
        while (trackingTable.length !== 0) {
            const table: string = trackingTable.shift()!;
            const relation: { [key: string]: IQueryChainRelation } = this.completeRelationMap[table];
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
            const relation: { [key: string]: IQueryChainRelation } = this.completeRelationMap[table];
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
        return new QueryChain(forwardRelationMap, backwardRelationMap);
    }

    private safeMapAssign(map: any, key1: string, key2: string, value: any): void {
        if (map[key1] === undefined) map[key1] = {};
        map[key1][key2] = value;
    }

    private extractRelation(relation: string): IQueryChainRelation {
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

export default QueryChainBuilder;
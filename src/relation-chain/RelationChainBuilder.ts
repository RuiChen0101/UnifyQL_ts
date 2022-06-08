import RelationChain from "./RelationChain";
import IRelationChainNode from "./IRelationChainNode";
import IUnifyQLElement from "../unify-ql-element/IUnifyQLElement";
import RelationChainException from "../exception/RelationChainException";

type IRelationChainMap = { [key: string]: { [key: string]: IRelationChainNode } };

class RelationChainBuilder {
    private target: string = '';
    private completeRelationMap: IRelationChainMap = {};

    constructor(element: IUnifyQLElement) {
        this.target = element.queryTarget;
        let definedTables: string[] = [this.target, ...element.with];
        for (const relation of element.link) {
            const tableRelation: IRelationChainNode = this.extractRelation(relation);
            if (!definedTables.includes(tableRelation.fromTable) || !definedTables.includes(tableRelation.toTable)) {
                throw new RelationChainException(`RelationChain: ${relation} using undefined table`);
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
                this.safeMapAssign(forwardRelationMap, table, descendant, relation[descendant]);
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
        const regex: RegExp = /([^\s]+)\.([^\s]+)\s*=\s*([^\s]+)\.([^\s]+)/g;
        const capturedGroups: RegExpExecArray | null = regex.exec(relation);
        if (capturedGroups === null || capturedGroups.length !== 5) throw new RelationChainException(`RelationChain: ${relation} invalid format`);
        return {
            fromTable: capturedGroups[1],
            fromField: capturedGroups[2],
            toTable: capturedGroups[3],
            toField: capturedGroups[4]
        };
    }
}

export default RelationChainBuilder;
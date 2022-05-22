import IRelationChainNode from "./IRelationChainNode";
import RelationChainException from "../exception/RelationChainException";

type IRelationChainMap = { [key: string]: { [key: string]: IRelationChainNode } };

class RelationChain {
    public readonly forwardRelationMap: IRelationChainMap;
    public readonly backwardRelationMap: IRelationChainMap;

    constructor(forwardRelationMap: IRelationChainMap, backwardRelationMap: IRelationChainMap) {
        this.forwardRelationMap = forwardRelationMap;
        this.backwardRelationMap = backwardRelationMap;
    }

    public findLowestCommonParent(table1: string, table2: string): string {
        const table1ToRoot: string[] = [table1];
        let parents = this.backwardRelationMap[table1];
        while (parents !== undefined) {
            const parentTable = Object.keys(parents)[0];
            table1ToRoot.push(parentTable);
            parents = this.backwardRelationMap[parentTable];
        }
        if (table1ToRoot.includes(table2)) return table2;
        parents = this.backwardRelationMap[table2];
        while (parents !== undefined) {
            const parentTable = Object.keys(parents)[0];
            if (table1ToRoot.includes(parentTable)) return parentTable;
            parents = this.backwardRelationMap[parentTable];
        }
        throw new RelationChainException(`${table1} and ${table2} has no common parent`);
    }

    public findRelationPath(from: string, to: string): IRelationChainNode[] | undefined {
        const result: IRelationChainNode[] = [];
        if (this.isDescendantOf(from, to)) {
            let parents = this.backwardRelationMap[from];
            while (parents !== undefined) {
                const parentTable = Object.keys(parents)[0];
                result.push(parents[parentTable]);
                if (parentTable === to) {
                    return result;
                };
                parents = this.backwardRelationMap[parentTable];
            }
            return undefined;
        } else {
            let parents = this.backwardRelationMap[to];
            while (parents !== undefined) {
                const parentTable = Object.keys(parents)[0];
                result.push(parents[parentTable]);
                if (parentTable === from) {
                    return result.reverse();
                };
                parents = this.backwardRelationMap[parentTable];
            }
            return undefined;
        }
    }

    public isDescendantOf(table1: string, table2: string): boolean {
        return this.isParentOf(table2, table1);
    }

    public isParentOf(table1: string, table2: string): boolean {
        let parents = this.backwardRelationMap[table2];
        while (parents !== undefined) {
            const parentTable = Object.keys(parents)[0];
            if (parentTable === table1) return true;
            parents = this.backwardRelationMap[parentTable];
        }
        return false;
    }

    public getDirectDescendant(target: string): IRelationChainNode[] {
        if (this.forwardRelationMap[target] === undefined) return [];
        return Object.values(this.forwardRelationMap[target]);
    }

    public getDirectParent(target: string): IRelationChainNode[] {
        if (this.backwardRelationMap[target] === undefined) return [];
        return Object.values(this.backwardRelationMap[target]);
    }
}

export default RelationChain;
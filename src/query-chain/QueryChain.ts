import IQueryChainRelation from "./IQueryChainRelation";

type IQueryChainRelationMap = { [key: string]: { [key: string]: IQueryChainRelation } };

class QueryChain {
    private _forwardRelationMap: IQueryChainRelationMap = {};
    private _backwardRelationMap: IQueryChainRelationMap = {};

    constructor(forwardRelationMap: IQueryChainRelationMap, backwardRelationMap: IQueryChainRelationMap) {
        this._forwardRelationMap = forwardRelationMap;
        this._backwardRelationMap = backwardRelationMap;
    }

    public get forwardRelationMap(): IQueryChainRelationMap {
        return this._forwardRelationMap;
    }

    public get backwardRelationMap(): IQueryChainRelationMap {
        return this._backwardRelationMap;
    }
}

export default QueryChain;
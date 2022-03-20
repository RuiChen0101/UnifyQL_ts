import IExpressionTreeNode from "./ExpressionTreeNode";

class RelationNode extends IExpressionTreeNode {
    public readonly toTable: string;
    public readonly toField: string;
    public readonly fromTable: string;
    public readonly fromField: string;

    constructor(fromTable: string, fromField: string, toTable: string, toField: string) {
        super();
        this.toTable = toTable;
        this.toField = toField;
        this.fromTable = fromTable;
        this.fromField = fromField;
    }

    public setLeftNode(node: IExpressionTreeNode): void {
        this._leftNode = node;
    }
}

export default RelationNode;
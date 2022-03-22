import IExpressionTreeNode from "./ExpressionTreeNode";

class OutputTargetNode extends IExpressionTreeNode {
    public readonly outputTarget: string;
    public readonly orderBy?: string[];
    public readonly limit?: number[];

    constructor(outputTarget: string, orderBy?: string[], limit?: number[]) {
        super();
        this.outputTarget = outputTarget;
        this.orderBy = orderBy;
        this.limit = limit;
    }

    public setLeftNode(node?: IExpressionTreeNode): void {
        this._leftNode = node;
    }
}

export default OutputTargetNode;
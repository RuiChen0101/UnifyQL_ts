import IExpressionTreeNode from "./ExpressionTreeNode";

class BinaryOperatorNode extends IExpressionTreeNode {
    public readonly opType: 'AND' | 'OR';

    constructor(opType: 'AND' | 'OR') {
        super();
        this.opType = opType;
    }

    public setLeftNode(node: IExpressionTreeNode): void {
        this._leftNode = node;
    }

    public setRightNode(node: IExpressionTreeNode): void {
        this._rightNode = node;
    }
}

export default BinaryOperatorNode;
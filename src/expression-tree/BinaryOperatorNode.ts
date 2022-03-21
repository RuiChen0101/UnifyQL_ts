import IExpressionTreeNode from "./ExpressionTreeNode";

class BinaryOperatorNode extends IExpressionTreeNode {
    public readonly opType: 'AND' | 'OR';
    private _outputTarget: string | undefined;

    constructor(opType: 'AND' | 'OR') {
        super();
        this.opType = opType;
    }

    public get outputTarget(): string | undefined {
        return this._outputTarget;
    }

    public setOutputTarget(target: string): void {
        this._outputTarget = target;
    }

    public setLeftNode(node: IExpressionTreeNode): void {
        this._leftNode = node;
    }

    public setRightNode(node: IExpressionTreeNode): void {
        this._rightNode = node;
    }
}

export default BinaryOperatorNode;
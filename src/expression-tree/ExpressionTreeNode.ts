import UnsupportedOperationException from "../exception/UnsupportedOperationException";

class IExpressionTreeNode {
    protected _leftNode?: IExpressionTreeNode;
    protected _rightNode?: IExpressionTreeNode;

    public setLeftNode(node: IExpressionTreeNode): void {
        throw new UnsupportedOperationException();
    }

    public setRightNode(node: IExpressionTreeNode): void {
        throw new UnsupportedOperationException();
    }

    public get leftNode(): IExpressionTreeNode | undefined {
        return this._leftNode;
    }

    public get rightNode(): IExpressionTreeNode | undefined {
        return this._rightNode;
    }
}

export default IExpressionTreeNode;
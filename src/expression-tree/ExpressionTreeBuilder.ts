import ExpressionTreeBuildException from "../exception/ExpressionTreeBuildException";
import BinaryOperatorNode from "./BinaryOperatorNode";
import ConditionNode from "./ConditionNode";
import IExpressionTreeNode from "./ExpressionTreeNode";

class ExpressionTreeBuilder {
    private _expressionTree?: IExpressionTreeNode;
    private _nodeStack: IExpressionTreeNode[] = [];

    public buildCondition(condition: string): void {
        if (this._expressionTree === undefined) {
            this._expressionTree = new ConditionNode(condition);
            return;
        }
        if (!(this._expressionTree instanceof BinaryOperatorNode)) {
            throw new ExpressionTreeBuildException('Bad state: is not binary operator node');
        }
        if (this._expressionTree.leftNode !== undefined) {
            throw new ExpressionTreeBuildException('Bad state: left node already been set');
        }
        this._expressionTree.setLeftNode(new ConditionNode(condition));
    }

    public buildOr(): void {
        if (this._expressionTree === undefined) {
            throw new ExpressionTreeBuildException('Bad state: dangling OR operator');
        }
        const orNode: IExpressionTreeNode = new BinaryOperatorNode('OR');
        orNode.setRightNode(this._expressionTree);
        this._nodeStack.push(orNode);
        this._expressionTree = undefined;
    }

    public buildAnd(): void {
        if (this._expressionTree === undefined) {
            throw new ExpressionTreeBuildException('Bad state: dangling AND operator');
        }
        const andNode: IExpressionTreeNode = new BinaryOperatorNode('AND');
        andNode.setRightNode(this._expressionTree);
        this._expressionTree = andNode;
    }

    public startBuildParentheses(): void {
        if (this._expressionTree === undefined) return;
        this._nodeStack.push(this._expressionTree);
        this._expressionTree = undefined;
    }

    public endBuildParentheses(): void {
        const stackTop: IExpressionTreeNode | undefined = this._nodeStack.pop();
        if (stackTop === undefined) return;
        if (this._expressionTree === undefined) throw new ExpressionTreeBuildException('Bad state: empty parentheses');
        stackTop.setLeftNode(this._expressionTree)
        this._expressionTree = stackTop;
    }

    private flush(): void {
        if (this._expressionTree === undefined) {
            throw new ExpressionTreeBuildException('Bad state: dangling AND operator');
        }
        while (this._nodeStack.length !== 0) {
            const stackTop: IExpressionTreeNode = this._nodeStack.pop()!;
            stackTop.setLeftNode(this._expressionTree!)
            this._expressionTree = stackTop;
        }
    }

    public getResult(): IExpressionTreeNode {
        this.flush();
        return this._expressionTree!;
    }
}

export default ExpressionTreeBuilder;
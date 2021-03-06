import ConditionNode from "./ConditionNode";
import BinaryOperatorNode from "./BinaryOperatorNode";
import IExpressionTreeNode from "./ExpressionTreeNode";
import BadFormatException from '../exception/BadFormatException';
import ExpressionTreeBuildException from "../exception/ExpressionTreeBuildException";

class BrokenConditionNode extends IExpressionTreeNode {
    public readonly condition: string;

    constructor(condition: string) {
        super();
        this.condition = condition;
    }
}

class ParenthesesMarkerNode extends IExpressionTreeNode { }

class ExpressionTreeBuilder {
    private _expressionTree?: IExpressionTreeNode;
    private _nodeStack: IExpressionTreeNode[] = [];

    public buildCondition(condition: string): void {
        try {
            const node = new ConditionNode(condition);
            if (this._expressionTree === undefined) {
                this._expressionTree = node
                return;
            }
            if (!(this._expressionTree instanceof BinaryOperatorNode)) {
                throw new ExpressionTreeBuildException('Bad state: is not binary operator node');
            }
            if (this._expressionTree.rightNode !== undefined) {
                throw new ExpressionTreeBuildException('Bad state: right node already been set');
            }
            this._expressionTree.setRightNode(new ConditionNode(condition));
        } catch (e) {
            if (e instanceof BadFormatException) {
                this._nodeStack.push(new BrokenConditionNode(condition));
                this.tryRestoreBrokenCondition();
                return;
            }
            throw e
        }
    }

    public buildOr(): void {
        if (this._expressionTree === undefined) {
            throw new ExpressionTreeBuildException('Bad state: dangling OR operator');
        }
        const orNode: IExpressionTreeNode = new BinaryOperatorNode('OR');
        orNode.setLeftNode(this._expressionTree);
        this._nodeStack.push(orNode);
        this._expressionTree = undefined;
    }

    public buildAnd(): void {
        if (this._expressionTree === undefined) {
            throw new ExpressionTreeBuildException('Bad state: dangling AND operator');
        }
        const andNode: IExpressionTreeNode = new BinaryOperatorNode('AND');
        andNode.setLeftNode(this._expressionTree);
        this._expressionTree = andNode;
    }

    public startBuildParentheses(): void {
        if (this._expressionTree !== undefined) {
            this._nodeStack.push(this._expressionTree);
            this._expressionTree = undefined;
        }
        this._nodeStack.push(new ParenthesesMarkerNode());
    }

    public endBuildParentheses(): void {
        let stackTop: IExpressionTreeNode | undefined = this._nodeStack.pop();
        if (stackTop === undefined) return;
        if (stackTop instanceof BrokenConditionNode) {
            this._nodeStack.pop();
            this._nodeStack.push(new BrokenConditionNode(`(${(stackTop as BrokenConditionNode).condition})`));
            this.tryRestoreBrokenCondition();
            return;
        }
        if (this._expressionTree === undefined) throw new ExpressionTreeBuildException('Bad state: empty parentheses');
        while (!(stackTop instanceof ParenthesesMarkerNode)) {
            stackTop.setRightNode(this._expressionTree!)
            this._expressionTree = stackTop;
            stackTop = this._nodeStack.pop()!;
        }
    }

    private flush(): void {
        if (this._expressionTree === undefined) {
            throw new ExpressionTreeBuildException('Bad state: empty tree');
        } else if (this._expressionTree instanceof BinaryOperatorNode && (this._expressionTree.leftNode === undefined || this._expressionTree.rightNode === undefined)) {
            throw new ExpressionTreeBuildException(`Bad state: dangling ${this._expressionTree.opType} operator`);
        }
        while (this._nodeStack.length !== 0) {
            const stackTop: IExpressionTreeNode = this._nodeStack.pop()!;
            if (stackTop instanceof BrokenConditionNode) {
                throw new ExpressionTreeBuildException('Bad state: unresolved broken node');
            }
            stackTop.setRightNode(this._expressionTree!);
            this._expressionTree = stackTop;
        }
    }

    private tryRestoreBrokenCondition() {
        const stackLength: number = this._nodeStack.length;
        if (this._nodeStack[stackLength - 1] instanceof BrokenConditionNode && this._nodeStack[stackLength - 2] instanceof BrokenConditionNode) {
            const node1: BrokenConditionNode = this._nodeStack.pop() as BrokenConditionNode;
            const node2: BrokenConditionNode = this._nodeStack.pop() as BrokenConditionNode;
            this.buildCondition(node2.condition.trim() + ' ' + node1.condition.trim());
        }
    }

    public getResult(): IExpressionTreeNode | undefined {
        this.flush();
        return this._expressionTree;
    }
}

export default ExpressionTreeBuilder;
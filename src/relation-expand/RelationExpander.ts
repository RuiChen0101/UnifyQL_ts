import QueryChain from "../query-chain/QueryChain";
import RelationNode from "../expression-tree/RelationNode";
import ConditionNode from "../expression-tree/ConditionNode";
import OutputTargetNode from "../expression-tree/OutputTargetNode";
import IQueryChainRelation from "../query-chain/IQueryChainRelation";
import BinaryOperatorNode from "../expression-tree/BinaryOperatorNode";
import IExpressionTreeNode from "../expression-tree/ExpressionTreeNode";
import RelationExpanderException from "../exception/RelationExpanderException";

class RelationExpander {
    private _queryChain: QueryChain;
    private _resultTable: string = '';
    private _expressionTree: IExpressionTreeNode;

    constructor(expressionTree: IExpressionTreeNode, queryChain: QueryChain) {
        this._queryChain = queryChain;
        this._expressionTree = expressionTree;
    }

    public expand(): string {
        this._resultTable = this._expand();
        if (this._expressionTree instanceof BinaryOperatorNode) {
            (this._expressionTree as BinaryOperatorNode).setOutputTarget(this._resultTable);
        }
        return this._resultTable;
    }

    private finalize(target: string): void {
        if (target === this._resultTable) {
            return;
        }

        if (this._queryChain.isParentOf(target, this._resultTable)) {
            const relationPath: IQueryChainRelation[] = this._queryChain.findRelationPath(this._resultTable, target)!;
            for (const path of relationPath) {
                const relationNode = new RelationNode(path.fromTable, path.fromField, path.toTable, path.toField);
                relationNode.setLeftNode(this._expressionTree);
                this._expressionTree = relationNode;
            }
        } else {
            throw new RelationExpanderException(`${target} is not parent of ${this._resultTable}`);
        }
    }

    private _expand(): string {
        const rootNode = this._expressionTree;
        if (rootNode instanceof ConditionNode) {
            return (rootNode as ConditionNode).table;
        }

        if (rootNode instanceof OutputTargetNode) {
            if (rootNode.leftNode === undefined) return rootNode.outputTarget;
            const expander = new RelationExpander(rootNode.leftNode!, this._queryChain);
            expander.expand();
            expander.finalize(rootNode.outputTarget);
            rootNode.setLeftNode(expander.getResult());
            return rootNode.outputTarget;
        }

        let leftNodeResultTable: string;
        let rightNodeResultTable: string;

        if (rootNode.leftNode === undefined || rootNode.rightNode === undefined) {
            throw new RelationExpanderException('Invalid expression tree');
        }

        const leftExpander = new RelationExpander(rootNode.leftNode, this._queryChain);
        leftNodeResultTable = leftExpander.expand();
        rootNode.setLeftNode(leftExpander.getResult());

        const rightExpander = new RelationExpander(rootNode.rightNode!, this._queryChain);
        rightNodeResultTable = rightExpander.expand();
        rootNode.setRightNode(rightExpander.getResult());

        if (leftNodeResultTable === rightNodeResultTable) return leftNodeResultTable;

        const commonParent: string = this._queryChain.findLowestCommonParent(rightNodeResultTable, leftNodeResultTable);

        if (leftNodeResultTable !== commonParent) {
            const relationPath: IQueryChainRelation[] = this._queryChain.findRelationPath(leftNodeResultTable, commonParent)!;
            for (const path of relationPath) {
                const relationNode = new RelationNode(path.fromTable, path.fromField, path.toTable, path.toField);
                relationNode.setLeftNode(rootNode.leftNode);
                rootNode.setLeftNode(relationNode);
            }
        }

        if (rightNodeResultTable !== commonParent) {
            const relationPath: IQueryChainRelation[] = this._queryChain.findRelationPath(rightNodeResultTable, commonParent)!;
            for (const path of relationPath) {
                const relationNode = new RelationNode(path.fromTable, path.fromField, path.toTable, path.toField);
                relationNode.setLeftNode(rootNode.rightNode);
                rootNode.setRightNode(relationNode);
            }
        }

        return commonParent;
    }

    public getResult(): IExpressionTreeNode {
        return this._expressionTree;
    }
}

export default RelationExpander;
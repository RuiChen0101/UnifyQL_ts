import RelationNode from "../expression-tree/RelationNode";
import RelationChain from "../relation-chain/RelationChain";
import ConditionNode from "../expression-tree/ConditionNode";
import OutputTargetNode from "../expression-tree/OutputTargetNode";
import BinaryOperatorNode from "../expression-tree/BinaryOperatorNode";
import IExpressionTreeNode from "../expression-tree/ExpressionTreeNode";
import IRelationChainRelation from "../relation-chain/IRelationChainNode";
import RelationLinkerException from "../exception/RelationLinkerException";

class RelationLinker {
    private _relationChain: RelationChain;
    private _resultTable: string = '';
    private _expressionTree: IExpressionTreeNode;

    constructor(expressionTree: IExpressionTreeNode, relationChain: RelationChain) {
        this._relationChain = relationChain;
        this._expressionTree = expressionTree;
    }

    public link(): string {
        this._resultTable = this._linking();
        if (this._expressionTree instanceof BinaryOperatorNode) {
            (this._expressionTree as BinaryOperatorNode).setOutputTarget(this._resultTable);
        }
        return this._resultTable;
    }

    private finalize(target: string): void {
        if (target === this._resultTable) {
            return;
        }

        if (this._relationChain.isParentOf(target, this._resultTable)) {
            const relationPath: IRelationChainRelation[] = this._relationChain.findRelationPath(this._resultTable, target)!;
            for (const path of relationPath) {
                const relationNode = new RelationNode(path.fromTable, path.fromField, path.toTable, path.toField);
                relationNode.setLeftNode(this._expressionTree);
                this._expressionTree = relationNode;
            }
        } else {
            throw new RelationLinkerException(`${target} is not parent of ${this._resultTable}`);
        }
    }

    private _linking(): string {
        const rootNode = this._expressionTree;
        if (rootNode instanceof ConditionNode) {
            return (rootNode as ConditionNode).table;
        }

        if (rootNode instanceof OutputTargetNode) {
            if (rootNode.leftNode === undefined) return rootNode.outputTarget;
            const linker = new RelationLinker(rootNode.leftNode!, this._relationChain);
            linker.link();
            linker.finalize(rootNode.outputTarget);
            rootNode.setLeftNode(linker.getResult());
            return rootNode.outputTarget;
        }

        if (rootNode.leftNode === undefined || rootNode.rightNode === undefined) {
            throw new RelationLinkerException('Invalid expression tree');
        }

        const leftExpander = new RelationLinker(rootNode.leftNode, this._relationChain);
        const leftNodeResultTable = leftExpander.link();
        rootNode.setLeftNode(leftExpander.getResult());

        const rightExpander = new RelationLinker(rootNode.rightNode!, this._relationChain);
        const rightNodeResultTable = rightExpander.link();
        rootNode.setRightNode(rightExpander.getResult());

        if (leftNodeResultTable === rightNodeResultTable) return leftNodeResultTable;

        const commonParent: string = this._relationChain.findLowestCommonParent(rightNodeResultTable, leftNodeResultTable);

        if (leftNodeResultTable !== commonParent) {
            const relationPath: IRelationChainRelation[] = this._relationChain.findRelationPath(leftNodeResultTable, commonParent)!;
            for (const path of relationPath) {
                const relationNode = new RelationNode(path.fromTable, path.fromField, path.toTable, path.toField);
                relationNode.setLeftNode(rootNode.leftNode);
                rootNode.setLeftNode(relationNode);
            }
        }

        if (rightNodeResultTable !== commonParent) {
            const relationPath: IRelationChainRelation[] = this._relationChain.findRelationPath(rightNodeResultTable, commonParent)!;
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

export default RelationLinker;
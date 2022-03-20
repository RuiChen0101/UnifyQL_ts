import injector from "../utility/Injector";
import QueryChain from "../query-chain/QueryChain";
import ServiceLookup from "../lookup/ServiceLookup";
import RelationNode from "../expression-tree/RelationNode";
import ConditionNode from "../expression-tree/ConditionNode";
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
        return this._resultTable;
    }

    public finalize(target: string): void {
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

        let leftNodeResultTable: string;
        let rightNodeResultTable: string;

        if (rootNode.leftNode instanceof BinaryOperatorNode) {
            const expander = new RelationExpander(rootNode.leftNode, this._queryChain);
            leftNodeResultTable = expander.expand();
            rootNode.setLeftNode(expander.getResult());
        } else if (rootNode.leftNode instanceof ConditionNode) {
            leftNodeResultTable = (rootNode.leftNode as ConditionNode).table;
        } else {
            throw new RelationExpanderException('Invalid expression tree');
        }

        if (rootNode.rightNode instanceof BinaryOperatorNode) {
            const expander = new RelationExpander(rootNode.rightNode, this._queryChain);
            rightNodeResultTable = expander.expand();
            rootNode.setRightNode(expander.getResult());
        } else if (rootNode.rightNode instanceof ConditionNode) {
            rightNodeResultTable = (rootNode.rightNode as ConditionNode).table;
        } else {
            throw new RelationExpanderException('Invalid expression tree');
        }

        if (leftNodeResultTable === rightNodeResultTable) return leftNodeResultTable;
        if (injector.get<ServiceLookup>('ServiceLookup').isAllFromSameService([leftNodeResultTable, rightNodeResultTable])) {
            return this._queryChain.isParentOf(leftNodeResultTable, rightNodeResultTable) ? leftNodeResultTable : rightNodeResultTable;
        }

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
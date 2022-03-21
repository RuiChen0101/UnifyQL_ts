import 'mocha';
import { expect } from 'chai';
import IExpressionTreeNode from '../../src/expression-tree/ExpressionTreeNode';
import ExpressionTreeBuilder from '../../src/expression-tree/ExpressionTreeBuilder';
import ConditionNode from '../../src/expression-tree/ConditionNode';
import BinaryOperatorNode from '../../src/expression-tree/BinaryOperatorNode';

describe('ExpressionTreeBuilder', () => {
    it('should build new condition node when first call buildCondition', () => {
        const builder: ExpressionTreeBuilder = new ExpressionTreeBuilder();
        builder.buildCondition('(tableB.fieldB & 2) != 0');
        const expressionTree: IExpressionTreeNode = builder.getResult();
        expect((expressionTree as ConditionNode).conditionStr).to.be.equal('(tableB.fieldB & 2) != 0');
    });

    it('should build new andNode and append exist tree to left branch when call buildAnd', () => {
        const builder: ExpressionTreeBuilder = new ExpressionTreeBuilder();
        builder.buildCondition('(tableB.fieldB & 2) != 0');
        builder.buildAnd();
        const expressionTree: IExpressionTreeNode = builder.getResult();
        expect((expressionTree as BinaryOperatorNode).opType).to.be.equal('AND');
        expect((expressionTree.leftNode as ConditionNode).conditionStr).to.be.equal('(tableB.fieldB & 2) != 0');
    });

    it('should build new condition node and append itself to the tree\'s right branch when call buildCondition with exist tree', () => {
        const builder: ExpressionTreeBuilder = new ExpressionTreeBuilder();
        builder.buildCondition('(tableB.fieldB & 2) != 0');
        builder.buildAnd();
        builder.buildCondition('tableA.fieldA IN ("0912","0934")');
        const expressionTree: IExpressionTreeNode = builder.getResult();
        expect((expressionTree as BinaryOperatorNode).opType).to.be.equal('AND');
        expect((expressionTree.rightNode as ConditionNode).conditionStr).to.be.equal('tableA.fieldA IN ("0912","0934")');
        expect((expressionTree.leftNode as ConditionNode).conditionStr).to.be.equal('(tableB.fieldB & 2) != 0');
    });

    it('should build new orNode, append exist tree to right, push tree to stack and set current tree to right branch when call buildOr', () => {
        const builder: ExpressionTreeBuilder = new ExpressionTreeBuilder();
        builder.buildCondition('(tableB.fieldB & 2) != 0');
        builder.buildOr();
        builder.buildCondition('tableA.fieldA IN ("0912","0934")');
        const expressionTree: IExpressionTreeNode = builder.getResult();
        expect((expressionTree as BinaryOperatorNode).opType).to.be.equal('OR');
        expect((expressionTree.rightNode as ConditionNode).conditionStr).to.be.equal('tableA.fieldA IN ("0912","0934")');
        expect((expressionTree.leftNode as ConditionNode).conditionStr).to.be.equal('(tableB.fieldB & 2) != 0');
    });

    it('should build correct result mixing AND and OR', () => {
        const builder: ExpressionTreeBuilder = new ExpressionTreeBuilder();
        builder.buildCondition('(tableB.fieldB & 2) != 0');
        builder.buildOr();
        builder.buildCondition('tableA.fieldA IN ("0912","0934")');
        builder.buildAnd();
        builder.buildCondition('tableC.fieldC LIKE "O%"');
        const expressionTree: IExpressionTreeNode = builder.getResult();
        expect((expressionTree as BinaryOperatorNode).opType).to.be.equal('OR');
        expect((expressionTree.leftNode as ConditionNode).conditionStr).to.be.equal('(tableB.fieldB & 2) != 0');
        const andNode: IExpressionTreeNode = expressionTree.rightNode!;
        expect((andNode as BinaryOperatorNode).opType).to.be.equal('AND');
        expect((andNode.rightNode as ConditionNode).conditionStr).to.be.equal('tableC.fieldC LIKE "O%"');
        expect((andNode.leftNode as ConditionNode).conditionStr).to.be.equal('tableA.fieldA IN ("0912","0934")');
    });

    it('should build correct result with parentheses', () => {
        const builder: ExpressionTreeBuilder = new ExpressionTreeBuilder();
        builder.buildCondition('(tableB.fieldB & 2) != 0');
        builder.buildAnd();
        builder.startBuildParentheses();
        builder.buildCondition('tableA.fieldA IN ("0912","0934")');
        builder.buildOr();
        builder.buildCondition('tableC.fieldC LIKE "O%"');
        builder.endBuildParentheses();
        const expressionTree: IExpressionTreeNode = builder.getResult();
        expect((expressionTree as BinaryOperatorNode).opType).to.be.equal('AND');
        expect((expressionTree.leftNode as ConditionNode).conditionStr).to.be.equal('(tableB.fieldB & 2) != 0');
        const orNode: IExpressionTreeNode = expressionTree.rightNode!;
        expect((orNode as BinaryOperatorNode).opType).to.be.equal('OR');
        expect((orNode.rightNode as ConditionNode).conditionStr).to.be.equal('tableC.fieldC LIKE "O%"');
        expect((orNode.leftNode as ConditionNode).conditionStr).to.be.equal('tableA.fieldA IN ("0912","0934")');
    });

    it('should build correct result with all parentheses split', () => {
        const builder: ExpressionTreeBuilder = new ExpressionTreeBuilder();
        builder.startBuildParentheses();
        builder.buildCondition('tableB.fieldB & 2');
        builder.endBuildParentheses();
        builder.buildCondition('!= 0');
        builder.buildAnd();
        builder.startBuildParentheses();
        builder.buildCondition('tableA.fieldA IN ');
        builder.startBuildParentheses();
        builder.buildCondition('"0912","0934"');
        builder.endBuildParentheses();
        builder.buildOr();
        builder.buildCondition('tableC.fieldC LIKE "O%"');
        builder.endBuildParentheses();
        const expressionTree: IExpressionTreeNode = builder.getResult();
        expect((expressionTree as BinaryOperatorNode).opType).to.be.equal('AND');
        expect((expressionTree.leftNode as ConditionNode).conditionStr).to.be.equal('(tableB.fieldB & 2) != 0');
        const orNode: IExpressionTreeNode = expressionTree.rightNode!;
        expect((orNode as BinaryOperatorNode).opType).to.be.equal('OR');
        expect((orNode.rightNode as ConditionNode).conditionStr).to.be.equal('tableC.fieldC LIKE "O%"');
        expect((orNode.leftNode as ConditionNode).conditionStr).to.be.equal('tableA.fieldA IN ("0912","0934")');
    });
});
import 'mocha';
import { expect } from 'chai';
import QueryChainBuilder from '../../src/query-chain/QueryChainBuilder';
import RelationExpander from '../../src/relation-expand/RelationExpander';
import IExpressionTreeNode from '../../src/expression-tree/ExpressionTreeNode';
import ExpressionTreeParser from '../../src/expression-tree/ExpressionTreeParser';

describe('RelationExpander', () => {
    it('should direct return node if input express tree is just single condition', () => {
        const queryChainBuilder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const queryChain = queryChainBuilder.build();

        const whereStr: string = '(tableC.fieldC1 & 2) != 0';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(whereStr);

        const expander: RelationExpander = new RelationExpander(expressionTree, queryChain);

        const resultTable = expander.expand();
        const resultTree = expander.getResult();

        expect(resultTable).to.be.equal('tableC');
        expect(resultTree).to.be.deep.equal({
            "conditionOp": "!=",
            "conditionStr": "(tableC.fieldC1 & 2)!= 0",
            "conditionValue": "0",
            "field": "fieldC1",
            "modifier": "&",
            "modifyValue": "2",
            "table": "tableC"
        });
    });

    it('should expand and link relation to the same level for expression tree', () => {
        const queryChainBuilder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const queryChain = queryChainBuilder.build();

        const whereStr: string = 'tableA.fieldA = 0 AND tableD.fieldD1 = 1';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(whereStr);

        const expander: RelationExpander = new RelationExpander(expressionTree, queryChain);

        const resultTable = expander.expand();
        const resultTree = expander.getResult();

        expect(resultTable).to.be.equal('tableA');
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "conditionOp": "=",
                "conditionStr": "tableA.fieldA = 0",
                "conditionValue": "0",
                "field": "fieldA",
                "modifier": undefined,
                "modifyValue": undefined,
                "table": "tableA",
            },
            "_rightNode": {
                "_leftNode": {
                    "conditionOp": "=",
                    "conditionStr": "tableD.fieldD1 = 1",
                    "conditionValue": "1",
                    "field": "fieldD1",
                    "modifier": undefined,
                    "modifyValue": undefined,
                    "table": "tableD",
                },
                "fromField": "fieldD",
                "fromTable": "tableD",
                "toField": "fieldA1",
                "toTable": "tableA",
            },
            "opType": "AND",
        });
    });

    it('should skip expansion if left and right node are using the same table', () => {
        const queryChainBuilder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const queryChain = queryChainBuilder.build();

        const whereStr: string = 'tableC.fieldC1 = 0 AND tableC.fieldC2 = 1';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(whereStr);

        const expander: RelationExpander = new RelationExpander(expressionTree, queryChain);

        const resultTable = expander.expand();
        const resultTree = expander.getResult();

        expect(resultTable).to.be.equal('tableC');
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "conditionOp": "=",
                "conditionStr": "tableC.fieldC1 = 0",
                "conditionValue": "0",
                "field": "fieldC1",
                "modifier": undefined,
                "modifyValue": undefined,
                "table": "tableC",
            },
            "_rightNode": {
                "conditionOp": "=",
                "conditionStr": "tableC.fieldC2 = 1",
                "conditionValue": "1",
                "field": "fieldC2",
                "modifier": undefined,
                "modifyValue": undefined,
                "table": "tableC",
            },
            "opType": "AND",
        });
    });

    it('should skip expansion if left and right node are in same service and return resultTable as the table that has higher level', () => {
        const queryChainBuilder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const queryChain = queryChainBuilder.build();

        const whereStr: string = 'tableB.fieldB = 0 AND tableC.fieldC1 = 1';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(whereStr);

        const expander: RelationExpander = new RelationExpander(expressionTree, queryChain);

        const resultTable = expander.expand();
        const resultTree = expander.getResult();

        expect(resultTable).to.be.equal('tableB');
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "conditionOp": "=",
                "conditionStr": "tableB.fieldB = 0",
                "conditionValue": "0",
                "field": "fieldB",
                "modifier": undefined,
                "modifyValue": undefined,
                "table": "tableB",
            },
            "_rightNode": {
                "conditionOp": "=",
                "conditionStr": "tableC.fieldC1 = 1",
                "conditionValue": "1",
                "field": "fieldC1",
                "modifier": undefined,
                "modifyValue": undefined,
                "table": "tableC",
            },
            "opType": "AND",
        });
    });

    it('should expand and link relation for complex expression tree 1', () => {
        const queryChainBuilder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const queryChain = queryChainBuilder.build();

        const whereStr: string = 'tableD.fieldD1 = 0 AND tableD.fieldD2 = 1 AND (tableC.fieldC1 = 2 OR tableB.fieldB = 3)';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(whereStr);

        const expander: RelationExpander = new RelationExpander(expressionTree, queryChain);

        const resultTable = expander.expand();
        const resultTree = expander.getResult();

        expect(resultTable).to.be.equal('tableA');
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "_leftNode": {
                    "_leftNode": {
                        "conditionOp": "=",
                        "conditionStr": "tableD.fieldD1 = 0",
                        "conditionValue": "0",
                        "field": "fieldD1",
                        "modifier": undefined,
                        "modifyValue": undefined,
                        "table": "tableD",
                    },
                    "_rightNode": {
                        "conditionOp": "=",
                        "conditionStr": "tableD.fieldD2 = 1",
                        "conditionValue": "1",
                        "field": "fieldD2",
                        "modifier": undefined,
                        "modifyValue": undefined,
                        "table": "tableD",
                    },
                    "opType": "AND",
                },
                "fromField": "fieldD",
                "fromTable": "tableD",
                "toField": "fieldA1",
                "toTable": "tableA",
            },
            "_rightNode": {
                "_leftNode": {
                    "_leftNode": {
                        "conditionOp": "=",
                        "conditionStr": "tableC.fieldC1 = 2",
                        "conditionValue": "2",
                        "field": "fieldC1",
                        "modifier": undefined,
                        "modifyValue": undefined,
                        "table": "tableC",
                    },
                    "_rightNode": {
                        "conditionOp": "=",
                        "conditionStr": "tableB.fieldB = 3",
                        "conditionValue": "3",
                        "field": "fieldB",
                        "modifier": undefined,
                        "modifyValue": undefined,
                        "table": "tableB",
                    },
                    "opType": "OR",
                },
                "fromField": "fieldB2",
                "fromTable": "tableB",
                "toField": "fieldA2",
                "toTable": "tableA",
            },
            "opType": "AND",
        });
    });

    it('should link relation to target when call finalize', () => {
        const queryChainBuilder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const queryChain = queryChainBuilder.build();

        const whereStr: string = 'tableB.fieldB = 0 AND tableC.fieldC1 = 1';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(whereStr);

        const expander: RelationExpander = new RelationExpander(expressionTree, queryChain);

        const resultTable = expander.expand();
        expander.finalize('tableA');
        const resultTree = expander.getResult();

        expect(resultTable).to.be.equal('tableB');
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "_leftNode": {
                    "conditionOp": "=",
                    "conditionStr": "tableB.fieldB = 0",
                    "conditionValue": "0",
                    "field": "fieldB",
                    "modifier": undefined,
                    "modifyValue": undefined,
                    "table": "tableB",
                },
                "_rightNode": {
                    "conditionOp": "=",
                    "conditionStr": "tableC.fieldC1 = 1",
                    "conditionValue": "1",
                    "field": "fieldC1",
                    "modifier": undefined,
                    "modifyValue": undefined,
                    "table": "tableC",
                },
                "opType": "AND",
            },
            "fromField": "fieldB2",
            "fromTable": "tableB",
            "toField": "fieldA2",
            "toTable": "tableA",
        });
    });

    it('should skip link if result is already satisfy the target when call finalize', () => {
        const queryChainBuilder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const queryChain = queryChainBuilder.build();

        const whereStr: string = 'tableD.fieldD1 = 0 AND tableA.fieldA = 1';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(whereStr);

        const expander: RelationExpander = new RelationExpander(expressionTree, queryChain);

        const resultTable = expander.expand();
        expander.finalize('tableA');
        const resultTree = expander.getResult();

        expect(resultTable).to.be.equal('tableA');
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "_leftNode": {
                    "conditionOp": "=",
                    "conditionStr": "tableD.fieldD1 = 0",
                    "conditionValue": "0",
                    "field": "fieldD1",
                    "modifier": undefined,
                    "modifyValue": undefined,
                    "table": "tableD",
                },
                "fromField": "fieldD",
                "fromTable": "tableD",
                "toField": "fieldA1",
                "toTable": "tableA",
            },
            "_rightNode": {
                "conditionOp": "=",
                "conditionStr": "tableA.fieldA = 1",
                "conditionValue": "1",
                "field": "fieldA",
                "modifier": undefined,
                "modifyValue": undefined,
                "table": "tableA",
            },
            "opType": "AND",
        });
    });
});
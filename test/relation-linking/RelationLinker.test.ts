import 'mocha';
import { expect } from 'chai';

import RelationLinker from '../../src/relation-linking/RelationLinker';
import IExpressionTreeNode from '../../src/expression-tree/ExpressionTreeNode';
import RelationChainBuilder from '../../src/relation-chain/RelationChainBuilder';
import ExpressionTreeParser from '../../src/expression-tree/ExpressionTreeParser';

describe('RelationLinker', () => {
    it('should direct return node if input express tree is just output target node', () => {
        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const relationChain = relationChainBuilder.build();

        const whereStr: string = '';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse('tableA', whereStr, ['tableA.fieldA3 DESC'], [0, 100]);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);

        const resultTable = linker.expand();
        const resultTree = linker.getResult();

        expect(resultTable).to.be.equal('tableA');
        expect(resultTree).to.be.deep.equal({
            "_leftNode": undefined,
            "_rightNode": undefined,
            "limit": [0, 100],
            "orderBy": ['tableA.fieldA3 DESC'],
            "outputTarget": "tableA"
        });
    });

    it('should direct return node if input express tree is just single condition', () => {
        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const relationChain = relationChainBuilder.build();

        const whereStr: string = '(tableC.fieldC1 & 2) != 0';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse('tableA', whereStr, ['tableA.fieldA3 DESC'], [0, 100]);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);

        const resultTable = linker.expand();
        const resultTree = linker.getResult();

        expect(resultTable).to.be.equal('tableA');
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "_leftNode": {
                    "_leftNode": {
                        "_leftNode": undefined,
                        "_rightNode": undefined,
                        "conditionOp": "!=",
                        "conditionStr": "(tableC.fieldC1 & 2) != 0",
                        "conditionValue": "0",
                        "field": "fieldC1",
                        "modifier": "&",
                        "modifyValue": "2",
                        "table": "tableC",
                    },
                    "_rightNode": undefined,
                    "fromField": "fieldC",
                    "fromTable": "tableC",
                    "toField": "fieldB1",
                    "toTable": "tableB",
                },
                "_rightNode": undefined,
                "fromField": "fieldB2",
                "fromTable": "tableB",
                "toField": "fieldA2",
                "toTable": "tableA",
            },
            "_rightNode": undefined,
            "limit": [0, 100],
            "orderBy": ['tableA.fieldA3 DESC'],
            "outputTarget": "tableA"
        });
    });

    it('should expand and link relation to the same level for expression tree', () => {
        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const relationChain = relationChainBuilder.build();

        const whereStr: string = 'tableA.fieldA = 0 AND tableD.fieldD1 = 1';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse('tableA', whereStr);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);

        const resultTable = linker.expand();
        const resultTree = linker.getResult();

        expect(resultTable).to.be.equal('tableA');
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "_leftNode": {
                    "_leftNode": undefined,
                    "_rightNode": undefined,
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
                        "_leftNode": undefined,
                        "_rightNode": undefined,
                        "conditionOp": "=",
                        "conditionStr": "tableD.fieldD1 = 1",
                        "conditionValue": "1",
                        "field": "fieldD1",
                        "modifier": undefined,
                        "modifyValue": undefined,
                        "table": "tableD",
                    },
                    "_rightNode": undefined,
                    "fromField": "fieldD",
                    "fromTable": "tableD",
                    "toField": "fieldA1",
                    "toTable": "tableA",
                },
                "_outputTarget": "tableA",
                "opType": "AND",
            },
            "_rightNode": undefined,
            "limit": undefined,
            "orderBy": undefined,
            "outputTarget": "tableA"
        });
    });

    it('should skip expansion if left and right node are using the same table', () => {
        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const relationChain = relationChainBuilder.build();

        const whereStr: string = 'tableC.fieldC1 = 0 AND tableC.fieldC2 = 1';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse('tableA', whereStr);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);

        const resultTable = linker.expand();
        const resultTree = linker.getResult();

        expect(resultTable).to.be.equal('tableA');
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "_leftNode": {
                    "_leftNode": {
                        "_leftNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionOp": "=",
                            "conditionStr": "tableC.fieldC1 = 0",
                            "conditionValue": "0",
                            "field": "fieldC1",
                            "modifier": undefined,
                            "modifyValue": undefined,
                            "table": "tableC",
                        },
                        "_rightNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionOp": "=",
                            "conditionStr": "tableC.fieldC2 = 1",
                            "conditionValue": "1",
                            "field": "fieldC2",
                            "modifier": undefined,
                            "modifyValue": undefined,
                            "table": "tableC",
                        },
                        "_outputTarget": "tableC",
                        "opType": "AND",
                    },
                    "_rightNode": undefined,
                    "fromField": "fieldC",
                    "fromTable": "tableC",
                    "toField": "fieldB1",
                    "toTable": "tableB",
                },
                "_rightNode": undefined,
                "fromField": "fieldB2",
                "fromTable": "tableB",
                "toField": "fieldA2",
                "toTable": "tableA",
            },
            "_rightNode": undefined,
            "limit": undefined,
            "orderBy": undefined,
            "outputTarget": "tableA",
        });
    });

    it('should skip expansion if left and right node are in same service and return resultTable as the table that has higher level', () => {
        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const relationChain = relationChainBuilder.build();

        const whereStr: string = 'tableB.fieldB = 0 AND tableC.fieldC1 = 1';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse('tableA', whereStr);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);

        const resultTable = linker.expand();
        const resultTree = linker.getResult();

        expect(resultTable).to.be.equal('tableA');
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "_leftNode": {
                    "_leftNode": {
                        "_leftNode": undefined,
                        "_rightNode": undefined,
                        "conditionOp": "=",
                        "conditionStr": "tableB.fieldB = 0",
                        "conditionValue": "0",
                        "field": "fieldB",
                        "modifier": undefined,
                        "modifyValue": undefined,
                        "table": "tableB",
                    },
                    "_rightNode": {
                        "_leftNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionOp": "=",
                            "conditionStr": "tableC.fieldC1 = 1",
                            "conditionValue": "1",
                            "field": "fieldC1",
                            "modifier": undefined,
                            "modifyValue": undefined,
                            "table": "tableC",
                        },
                        "_rightNode": undefined,
                        "fromField": "fieldC",
                        "fromTable": "tableC",
                        "toField": "fieldB1",
                        "toTable": "tableB"
                    },
                    "_outputTarget": "tableB",
                    "opType": "AND",
                },
                "_rightNode": undefined,
                "fromField": "fieldB2",
                "fromTable": "tableB",
                "toField": "fieldA2",
                "toTable": "tableA"
            },
            "_rightNode": undefined,
            "limit": undefined,
            "orderBy": undefined,
            "outputTarget": "tableA"
        });
    });

    it('should expand and link relation for complex expression tree 1', () => {
        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const relationChain = relationChainBuilder.build();

        const whereStr: string = 'tableD.fieldD1 = 0 AND tableD.fieldD2 = 1 AND (tableC.fieldC1 = 2 OR tableB.fieldB = 3)';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse('tableA', whereStr);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);

        const resultTable = linker.expand();
        const resultTree = linker.getResult();

        expect(resultTable).to.be.equal('tableA');
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "_leftNode": {
                    "_leftNode": {
                        "_leftNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionOp": "=",
                            "conditionStr": "tableD.fieldD1 = 0",
                            "conditionValue": "0",
                            "field": "fieldD1",
                            "modifier": undefined,
                            "modifyValue": undefined,
                            "table": "tableD",
                        },
                        "_rightNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionOp": "=",
                            "conditionStr": "tableD.fieldD2 = 1",
                            "conditionValue": "1",
                            "field": "fieldD2",
                            "modifier": undefined,
                            "modifyValue": undefined,
                            "table": "tableD",
                        },
                        "_outputTarget": "tableD",
                        "opType": "AND",
                    },
                    "_rightNode": undefined,
                    "fromField": "fieldD",
                    "fromTable": "tableD",
                    "toField": "fieldA1",
                    "toTable": "tableA",
                },
                "_rightNode": {
                    "_leftNode": {
                        "_leftNode": {
                            "_leftNode": {
                                "_leftNode": undefined,
                                "_rightNode": undefined,
                                "conditionOp": "=",
                                "conditionStr": "tableC.fieldC1 = 2",
                                "conditionValue": "2",
                                "field": "fieldC1",
                                "modifier": undefined,
                                "modifyValue": undefined,
                                "table": "tableC",
                            },
                            "_rightNode": undefined,
                            "fromField": "fieldC",
                            "fromTable": "tableC",
                            "toField": "fieldB1",
                            "toTable": "tableB"
                        },
                        "_rightNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionOp": "=",
                            "conditionStr": "tableB.fieldB = 3",
                            "conditionValue": "3",
                            "field": "fieldB",
                            "modifier": undefined,
                            "modifyValue": undefined,
                            "table": "tableB",
                        },
                        "_outputTarget": "tableB",
                        "opType": "OR",
                    },
                    "_rightNode": undefined,
                    "fromField": "fieldB2",
                    "fromTable": "tableB",
                    "toField": "fieldA2",
                    "toTable": "tableA",
                },
                "_outputTarget": "tableA",
                "opType": "AND",
            },
            "_rightNode": undefined,
            "limit": undefined,
            "orderBy": undefined,
            "outputTarget": "tableA"
        });
    });

    it('should link relation to target when call finalize', () => {
        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const relationChain = relationChainBuilder.build();

        const whereStr: string = 'tableB.fieldB = 0 AND tableC.fieldC1 = 1';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse('tableA', whereStr);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);

        const resultTable = linker.expand();
        const resultTree = linker.getResult();

        expect(resultTable).to.be.equal('tableA');
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "_leftNode": {
                    "_leftNode": {
                        "_leftNode": undefined,
                        "_rightNode": undefined,
                        "conditionOp": "=",
                        "conditionStr": "tableB.fieldB = 0",
                        "conditionValue": "0",
                        "field": "fieldB",
                        "modifier": undefined,
                        "modifyValue": undefined,
                        "table": "tableB",
                    },
                    "_rightNode": {
                        "_leftNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionOp": "=",
                            "conditionStr": "tableC.fieldC1 = 1",
                            "conditionValue": "1",
                            "field": "fieldC1",
                            "modifier": undefined,
                            "modifyValue": undefined,
                            "table": "tableC",
                        },
                        "_rightNode": undefined,
                        "fromField": "fieldC",
                        "fromTable": "tableC",
                        "toField": "fieldB1",
                        "toTable": "tableB"
                    },
                    "_outputTarget": "tableB",
                    "opType": "AND",
                },
                "_rightNode": undefined,
                "fromField": "fieldB2",
                "fromTable": "tableB",
                "toField": "fieldA2",
                "toTable": "tableA",
            },
            "_rightNode": undefined,
            "limit": undefined,
            "orderBy": undefined,
            "outputTarget": "tableA"
        });
    });

    it('should skip link if result is already satisfy the target when call finalize', () => {
        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const relationChain = relationChainBuilder.build();

        const whereStr: string = 'tableD.fieldD1 = 0 AND tableA.fieldA = 1';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse('tableA', whereStr);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);

        const resultTable = linker.expand();
        const resultTree = linker.getResult();

        expect(resultTable).to.be.equal('tableA');
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "_leftNode": {
                    "_leftNode": {
                        "_leftNode": undefined,
                        "_rightNode": undefined,
                        "conditionOp": "=",
                        "conditionStr": "tableD.fieldD1 = 0",
                        "conditionValue": "0",
                        "field": "fieldD1",
                        "modifier": undefined,
                        "modifyValue": undefined,
                        "table": "tableD",
                    },
                    "_rightNode": undefined,
                    "fromField": "fieldD",
                    "fromTable": "tableD",
                    "toField": "fieldA1",
                    "toTable": "tableA",
                },
                "_rightNode": {
                    "_leftNode": undefined,
                    "_rightNode": undefined,
                    "conditionOp": "=",
                    "conditionStr": "tableA.fieldA = 1",
                    "conditionValue": "1",
                    "field": "fieldA",
                    "modifier": undefined,
                    "modifyValue": undefined,
                    "table": "tableA",
                },
                "_outputTarget": "tableA",
                "opType": "AND",
            },
            "_rightNode": undefined,
            "limit": undefined,
            "orderBy": undefined,
            "outputTarget": "tableA"
        });
    });
});
import 'mocha';
import { expect } from 'chai';
import ExpressionTreeParser from '../../src/expression-tree/ExpressionTreeParser';
import IExpressionTreeNode from '../../src/expression-tree/ExpressionTreeNode';

describe('ExpressionTreeParser', () => {
    it('should parse empty where condition to output target node', () => {
        const whereStr: string = '';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const resultTree: IExpressionTreeNode = parser.parse('tableA', whereStr, ['tableA.fieldA3 DESC'], [0, 100]);
        expect(resultTree).to.be.deep.equal({
            "_leftNode": undefined,
            "_rightNode": undefined,
            "limit": [
                0,
                100
            ],
            "orderBy": [
                "tableA.fieldA3 DESC"
            ],
            "outputTarget": "tableA"
        });
    });

    it('should parse where condition to expression node', () => {
        const whereStr: string = '(tableB.fieldB & 2) != 0';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const resultTree: IExpressionTreeNode = parser.parse('tableA', whereStr)!;
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "_leftNode": undefined,
                "_rightNode": undefined,
                "conditionOp": "!=",
                "conditionStr": "(tableB.fieldB & 2) != 0",
                "conditionValue": "0",
                "field": "fieldB",
                "modifier": "&",
                "modifyValue": "2",
                "table": "tableB",
            },
            "_rightNode": undefined,
            "limit": undefined,
            "orderBy": undefined,
            "outputTarget": "tableA",
        });
    });

    it('should parse where str to expression tree', () => {
        const whereStr: string = '(tableB.fieldB & 2) != 0 OR tableA.fieldA IN ("0912","0934") AND tableC.fieldC LIKE "O%"';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const resultTree: IExpressionTreeNode = parser.parse('tableA', whereStr)!;
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "_leftNode": {
                    "_leftNode": undefined,
                    "_rightNode": undefined,
                    "conditionOp": "!=",
                    "conditionStr": "(tableB.fieldB & 2) != 0",
                    "conditionValue": "0",
                    "field": "fieldB",
                    "modifier": "&",
                    "modifyValue": "2",
                    "table": "tableB",
                },
                "_rightNode": {
                    "_leftNode": {
                        "_leftNode": undefined,
                        "_rightNode": undefined,
                        "conditionOp": "IN",
                        "conditionStr": "tableA.fieldA IN (\"0912\",\"0934\")",
                        "conditionValue": "(\"0912\",\"0934\")",
                        "field": "fieldA",
                        "modifier": undefined,
                        "modifyValue": undefined,
                        "table": "tableA",
                    },
                    "_rightNode": {
                        "_leftNode": undefined,
                        "_rightNode": undefined,
                        "conditionOp": "LIKE",
                        "conditionStr": "tableC.fieldC LIKE \"O%\"",
                        "conditionValue": "\"O%\"",
                        "field": "fieldC",
                        "modifier": undefined,
                        "modifyValue": undefined,
                        "table": "tableC",
                    },
                    "_outputTarget": undefined,
                    "opType": "AND",
                },
                "_outputTarget": undefined,
                "opType": "OR",
            },
            "_rightNode": undefined,
            "limit": undefined,
            "orderBy": undefined,
            "outputTarget": "tableA",
        });
    });

    it('should parse where str with multiple parentheses to expression tree', () => {
        const whereStr: string = '(tableA.fieldA = 0 OR tableB.fieldB = 1 AND tableC.fieldC = 2) AND (tableD.fieldD = 3 AND tableE.fieldE = 4 OR tableF.fieldF = 5)';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const resultTree: IExpressionTreeNode = parser.parse('tableA', whereStr)!;
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
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
                            "conditionStr": "tableB.fieldB = 1",
                            "conditionValue": "1",
                            "field": "fieldB",
                            "modifier": undefined,
                            "modifyValue": undefined,
                            "table": "tableB",
                        },
                        "_rightNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionOp": "=",
                            "conditionStr": "tableC.fieldC = 2",
                            "conditionValue": "2",
                            "field": "fieldC",
                            "modifier": undefined,
                            "modifyValue": undefined,
                            "table": "tableC",
                        },
                        "_outputTarget": undefined,
                        "opType": "AND",
                    },
                    "_outputTarget": undefined,
                    "opType": "OR",
                },
                "_rightNode": {
                    "_leftNode": {
                        "_leftNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionOp": "=",
                            "conditionStr": "tableD.fieldD = 3",
                            "conditionValue": "3",
                            "field": "fieldD",
                            "modifier": undefined,
                            "modifyValue": undefined,
                            "table": "tableD",
                        },
                        "_rightNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionOp": "=",
                            "conditionStr": "tableE.fieldE = 4",
                            "conditionValue": "4",
                            "field": "fieldE",
                            "modifier": undefined,
                            "modifyValue": undefined,
                            "table": "tableE",
                        },
                        "_outputTarget": undefined,
                        "opType": "AND",
                    },
                    "_rightNode": {
                        "_leftNode": undefined,
                        "_rightNode": undefined,
                        "conditionOp": "=",
                        "conditionStr": "tableF.fieldF = 5",
                        "conditionValue": "5",
                        "field": "fieldF",
                        "modifier": undefined,
                        "modifyValue": undefined,
                        "table": "tableF",
                    },
                    "_outputTarget": undefined,
                    "opType": "OR",
                },
                "_outputTarget": undefined,
                "opType": "AND",
            },
            "_rightNode": undefined,
            "limit": undefined,
            "orderBy": undefined,
            "outputTarget": "tableA",
        });
    });

    it('should parse where str with recursive parentheses to expression tree', () => {
        const whereStr: string = 'tableA.fieldA = 0 AND ((tableB.fieldB = 1 OR tableC.fieldC = 2) AND (tableD.fieldD = 3 OR tableE.fieldE = 4))';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const resultTree: IExpressionTreeNode = parser.parse('tableA', whereStr)!;
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
                        "_leftNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionOp": "=",
                            "conditionStr": "tableB.fieldB = 1",
                            "conditionValue": "1",
                            "field": "fieldB",
                            "modifier": undefined,
                            "modifyValue": undefined,
                            "table": "tableB",
                        },
                        "_rightNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionOp": "=",
                            "conditionStr": "tableC.fieldC = 2",
                            "conditionValue": "2",
                            "field": "fieldC",
                            "modifier": undefined,
                            "modifyValue": undefined,
                            "table": "tableC",
                        },
                        "_outputTarget": undefined,
                        "opType": "OR",
                    },
                    "_rightNode": {
                        "_leftNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionOp": "=",
                            "conditionStr": "tableD.fieldD = 3",
                            "conditionValue": "3",
                            "field": "fieldD",
                            "modifier": undefined,
                            "modifyValue": undefined,
                            "table": "tableD",
                        },
                        "_rightNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionOp": "=",
                            "conditionStr": "tableE.fieldE = 4",
                            "conditionValue": "4",
                            "field": "fieldE",
                            "modifier": undefined,
                            "modifyValue": undefined,
                            "table": "tableE",
                        },
                        "_outputTarget": undefined,
                        "opType": "OR",
                    },
                    "_outputTarget": undefined,
                    "opType": "AND",
                },
                "_outputTarget": undefined,
                "opType": "AND",
            },
            "_rightNode": undefined,
            "limit": undefined,
            "orderBy": undefined,
            "outputTarget": "tableA"
        });
    });
});
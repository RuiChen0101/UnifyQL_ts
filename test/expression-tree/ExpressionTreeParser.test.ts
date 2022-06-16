import 'mocha';
import { expect } from 'chai';
import IUnifyQLElement from '../../src/unify-ql-element/IUnifyQLElement';
import EUnifyQLOperation from '../../src/unify-ql-element/EUnifyQLOperation';
import IExpressionTreeNode from '../../src/expression-tree/ExpressionTreeNode';
import ExpressionTreeParser from '../../src/expression-tree/ExpressionTreeParser';

describe('ExpressionTreeParser', () => {
    it('should parse empty where condition to output target node', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: [],
            link: [],
            where: '',
            orderBy: ['tableA.fieldA3 DESC'],
            limit: [0, 100]
        }
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const resultTree: IExpressionTreeNode = parser.parse(element);
        expect(resultTree).to.be.deep.equal({
            "_leftNode": undefined,
            "_rightNode": undefined,
            "limit": [
                0,
                100
            ],
            "operation": 0,
            "orderBy": [
                "tableA.fieldA3 DESC"
            ],
            "outputTarget": "tableA",
            "queryField": undefined
        });
    });

    it('should parse different operation to output target node', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Sum,
            queryTarget: 'tableA',
            queryField: 'fieldA4',
            with: [],
            link: [],
            where: '',
        }
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const resultTree: IExpressionTreeNode = parser.parse(element);
        expect(resultTree).to.be.deep.equal({
            "_leftNode": undefined,
            "_rightNode": undefined,
            "limit": undefined,
            "orderBy": undefined,
            "operation": 2,
            "outputTarget": "tableA",
            "queryField": "fieldA4"
        });
    });

    it('should parse where condition to expression node', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: [],
            link: [],
            where: '(tableB.fieldB & 2) != 0',
        }
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const resultTree: IExpressionTreeNode = parser.parse(element)!;
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "_leftNode": undefined,
                "_rightNode": undefined,
                "conditionStr": "(tableB.fieldB & 2) != 0",
                "table": "tableB",
            },
            "_rightNode": undefined,
            "limit": undefined,
            "orderBy": undefined,
            "operation": 0,
            "outputTarget": "tableA",
            "queryField": undefined
        });
    });

    it('should parse where str to expression tree', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: [],
            link: [],
            where: '(tableB.fieldB & 2) != 0 OR tableA.fieldA IN ("0912","0934") AND tableC.fieldC LIKE "O%"',
        }
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const resultTree: IExpressionTreeNode = parser.parse(element)!;
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "_leftNode": {
                    "_leftNode": undefined,
                    "_rightNode": undefined,
                    "conditionStr": "(tableB.fieldB & 2) != 0",
                    "table": "tableB",
                },
                "_rightNode": {
                    "_leftNode": {
                        "_leftNode": undefined,
                        "_rightNode": undefined,
                        "conditionStr": "tableA.fieldA IN (\"0912\",\"0934\")",
                        "table": "tableA",
                    },
                    "_rightNode": {
                        "_leftNode": undefined,
                        "_rightNode": undefined,
                        "conditionStr": "tableC.fieldC LIKE \"O%\"",
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
            "operation": 0,
            "outputTarget": "tableA",
            "queryField": undefined
        });
    });

    it('should parse where str with multiple parentheses to expression tree', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: [],
            link: [],
            where: '(tableA.fieldA = 0 OR tableB.fieldB = 1 AND tableC.fieldC = 2) AND (tableD.fieldD = 3 AND tableE.fieldE = 4 OR tableF.fieldF = 5)',
        }
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const resultTree: IExpressionTreeNode = parser.parse(element)!;
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "_leftNode": {
                    "_leftNode": {
                        "_leftNode": undefined,
                        "_rightNode": undefined,
                        "conditionStr": "tableA.fieldA = 0",
                        "table": "tableA",
                    },
                    "_rightNode": {
                        "_leftNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionStr": "tableB.fieldB = 1",
                            "table": "tableB",
                        },
                        "_rightNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionStr": "tableC.fieldC = 2",
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
                            "conditionStr": "tableD.fieldD = 3",
                            "table": "tableD",
                        },
                        "_rightNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionStr": "tableE.fieldE = 4",
                            "table": "tableE",
                        },
                        "_outputTarget": undefined,
                        "opType": "AND",
                    },
                    "_rightNode": {
                        "_leftNode": undefined,
                        "_rightNode": undefined,
                        "conditionStr": "tableF.fieldF = 5",
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
            "operation": 0,
            "outputTarget": "tableA",
            "queryField": undefined
        });
    });

    it('should parse where str with recursive parentheses to expression tree', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: [],
            link: [],
            where: 'tableA.fieldA = 0 AND ((tableB.fieldB = 1 OR tableC.fieldC = 2) AND (tableD.fieldD = 3 OR tableE.fieldE = 4))',
        }
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const resultTree: IExpressionTreeNode = parser.parse(element)!;
        expect(resultTree).to.be.deep.equal({
            "_leftNode": {
                "_leftNode": {
                    "_leftNode": undefined,
                    "_rightNode": undefined,
                    "conditionStr": "tableA.fieldA = 0",
                    "table": "tableA",
                },
                "_rightNode": {
                    "_leftNode": {
                        "_leftNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionStr": "tableB.fieldB = 1",
                            "table": "tableB",
                        },
                        "_rightNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionStr": "tableC.fieldC = 2",
                            "table": "tableC",
                        },
                        "_outputTarget": undefined,
                        "opType": "OR",
                    },
                    "_rightNode": {
                        "_leftNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionStr": "tableD.fieldD = 3",
                            "table": "tableD",
                        },
                        "_rightNode": {
                            "_leftNode": undefined,
                            "_rightNode": undefined,
                            "conditionStr": "tableE.fieldE = 4",
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
            "operation": 0,
            "outputTarget": "tableA",
            "queryField": undefined
        });
    });

    it('should throw exception if invalid statement - Authorization Bypass', () => {
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        expect(function () {
            const element: IUnifyQLElement = {
                operation: EUnifyQLOperation.Query,
                queryTarget: 'tableA',
                with: [],
                link: [],
                where: 'tableA.fieldA="valueA" OR 1=1--"',
            }
            parser.parse(element);
        }).to.throw('Bad state: empty tree');
        expect(function () {
            const element: IUnifyQLElement = {
                operation: EUnifyQLOperation.Query,
                queryTarget: 'tableA',
                with: [],
                link: [],
                where: 'tableA.fieldA=123 OR 1=1--',
            }
            parser.parse(element);
        }).to.throw('Bad state: empty tree');
        expect(function () {
            const element: IUnifyQLElement = {
                operation: EUnifyQLOperation.Query,
                queryTarget: 'tableA',
                with: [],
                link: [],
                where: 'tableA.fieldA IN (123) OR 1=1--)',
            }
            parser.parse(element);
        }).to.throw('Bad state: empty tree');
    });

    it('should throw exception if invalid statement - Malicious Commands', () => {
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        expect(function () {
            const element: IUnifyQLElement = {
                operation: EUnifyQLOperation.Query,
                queryTarget: 'tableA',
                with: [],
                link: [],
                where: 'tableA.fieldA="valueA"; DROP TABLE tableA--"',
            }
            parser.parse(element);
        }).to.throw('Bad state: empty tree');
        expect(function () {
            const element: IUnifyQLElement = {
                operation: EUnifyQLOperation.Query,
                queryTarget: 'tableA',
                with: [],
                link: [],
                where: 'tableA.fieldA=123; DROP TABLE tableA--',
            }
            parser.parse(element);
        }).to.throw('Bad state: empty tree');
        expect(function () {
            const element: IUnifyQLElement = {
                operation: EUnifyQLOperation.Query,
                queryTarget: 'tableA',
                with: [],
                link: [],
                where: 'tableA.fieldA IN (123); DROP TABLE tableA--)',
            }
            parser.parse(element);
        }).to.throw('Bad state: unresolved broken node');
    });
});
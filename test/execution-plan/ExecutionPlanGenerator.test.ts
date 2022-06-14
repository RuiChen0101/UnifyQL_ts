import 'mocha';
import { expect } from 'chai';
import { reset, when } from 'ts-mockito';

import injector from '../../src/utility/Injector';
import IdGenerator from '../../src/utility/IdGenerator';
import ServiceLookup from '../../src/lookup/ServiceLookup';
import RelationLinker from '../../src/relation-linking/RelationLinker';
import IUnifyQLElement from '../../src/unify-ql-element/IUnifyQLElement';
import EUnifyQLOperation from '../../src/unify-ql-element/EUnifyQLOperation';
import IExpressionTreeNode from '../../src/expression-tree/ExpressionTreeNode';
import RelationChainBuilder from '../../src/relation-chain/RelationChainBuilder';
import ExpressionTreeParser from '../../src/expression-tree/ExpressionTreeParser';
import ExecutionPlanGenerator from '../../src/execution-plan/ExecutionPlanGenerator';

const mockIdGenerator: IdGenerator = injector.get<IdGenerator>('MockIdGenerator');

const serviceLookup: ServiceLookup = new ServiceLookup();

describe('ExecutionPlanGenerator', () => {
    it('should generate execution plan for empty condition', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: ['tableB', 'tableC', 'tableD'],
            link: ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2'],
            where: '',
            orderBy: ['tableA.fieldA3 DESC'],
            limit: [0, 100]
        }

        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(element);
        const relationChain = relationChainBuilder.build();

        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(element);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);
        linker.link();
        const expandedTree = linker.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree, serviceLookup);
        generator.generate();

        const executionPlan = generator.getExecutionPlan();

        expect(executionPlan).to.be.deep.equal({
            "operation": 0,
            "dependency": {},
            "with": [],
            "link": [],
            "orderBy": ['tableA.fieldA3 DESC'],
            "limit": [0, 100],
            "query": "tableA",
            "where": ""
        });
    });

    it('should generate execution plan for special operation', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Sum,
            queryTarget: 'tableA',
            queryField: 'fieldA4',
            with: ['tableB', 'tableC', 'tableD'],
            link: ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2'],
            where: '',
            orderBy: ['tableA.fieldA3 DESC'],
            limit: [0, 100]
        }

        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(element);
        const relationChain = relationChainBuilder.build();

        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(element);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);
        linker.link();
        const expandedTree = linker.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree, serviceLookup);
        generator.generate();

        const executionPlan = generator.getExecutionPlan();

        expect(executionPlan).to.be.deep.equal({
            "operation": 2,
            "dependency": {},
            "with": [],
            "link": [],
            "orderBy": ['tableA.fieldA3 DESC'],
            "limit": [0, 100],
            "query": "tableA.fieldA4",
            "where": ""
        });
    });

    it('should generate execution plan for single condition', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: ['tableB', 'tableC', 'tableD'],
            link: ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2'],
            where: 'tableA.fieldA != 0',
        }

        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(element);
        const relationChain = relationChainBuilder.build();

        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(element);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);
        linker.link();
        const expandedTree = linker.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree, serviceLookup);
        generator.generate();

        const executionPlan = generator.getExecutionPlan();

        expect(executionPlan).to.be.deep.equal({
            "operation": 0,
            "dependency": {},
            "with": [],
            "link": [],
            "orderBy": undefined,
            "limit": undefined,
            "query": "tableA",
            "where": "tableA.fieldA != 0"
        });
    });

    it('should generate execution plan for condition and relation with the same service', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: ['tableB', 'tableC', 'tableD'],
            link: ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2'],
            where: '(tableC.fieldC1 & 2) != 0',
        }

        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(element);
        const relationChain = relationChainBuilder.build();

        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(element);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);
        linker.link();
        const expandedTree = linker.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree, serviceLookup);
        generator.generate();

        const executionPlan = generator.getExecutionPlan();

        expect(executionPlan).to.be.deep.equal({
            "operation": 0,
            "dependency": {},
            "with": [
                "tableC",
                "tableB"
            ],
            "link": ['tableC.fieldC=tableB.fieldB1', 'tableB.fieldB2=tableA.fieldA2'],
            "orderBy": undefined,
            "limit": undefined,
            "query": "tableA",
            "where": "(tableC.fieldC1 & 2) != 0"
        });
    });

    it('should generate execution plan for condition and relation with the different service', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: ['tableB', 'tableC', 'tableD'],
            link: ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2'],
            where: 'tableD.fieldD1 != 0',
        }

        when(mockIdGenerator.nano8()).thenReturn('12345678');
        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(element);
        const relationChain = relationChainBuilder.build();

        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(element);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);
        linker.link();
        const expandedTree = linker.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree, serviceLookup);
        generator.generate();

        const executionPlan = generator.getExecutionPlan();

        expect(executionPlan).to.be.deep.equal({
            "dependency": {
                "12345678": {
                    "operation": 0,
                    "dependency": {},
                    "with": [],
                    "link": [],
                    "orderBy": undefined,
                    "limit": undefined,
                    "query": "tableD.fieldD",
                    "where": "tableD.fieldD1 != 0"
                }
            },
            "operation": 0,
            "with": [],
            "link": [],
            "orderBy": undefined,
            "limit": undefined,
            "query": "tableA",
            "where": "tableA.fieldA1 IN {12345678}"
        });
    });

    it('should generate execution plan for condition and relation with recursive dependency', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: ['tableB', 'tableC', 'tableD'],
            link: ['tableC.fieldC=tableD.fieldD2', 'tableD.fieldD1=tableB.fieldB1', 'tableA.fieldA2=tableB.fieldB2'],
            where: 'tableC.fieldC1 != 0',
        }

        when(mockIdGenerator.nano8()).thenReturn('12345678').thenReturn('23456789');
        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(element);
        const relationChain = relationChainBuilder.build();

        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(element);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);
        linker.link();
        const expandedTree = linker.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree, serviceLookup);
        generator.generate();

        const executionPlan = generator.getExecutionPlan();

        expect(executionPlan).to.be.deep.equal({
            "dependency": {
                "23456789": {
                    "dependency": {
                        "12345678": {
                            "operation": 0,
                            "dependency": {},
                            "with": [],
                            "link": [],
                            "orderBy": undefined,
                            "limit": undefined,
                            "query": "tableC.fieldC",
                            "where": "tableC.fieldC1 != 0"
                        }
                    },
                    "operation": 0,
                    "with": [],
                    "link": [],
                    "orderBy": undefined,
                    "limit": undefined,
                    "query": "tableD.fieldD1",
                    "where": "tableD.fieldD2 IN {12345678}"
                }
            },
            "operation": 0,
            "with": [
                "tableB",
            ],
            "link": [
                "tableB.fieldB2=tableA.fieldA2"
            ],
            "orderBy": undefined,
            "limit": undefined,
            "query": "tableA",
            "where": "tableB.fieldB1 IN {23456789}"
        });
    });

    it('should generate execution plan for expression tree with the same service', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: ['tableB', 'tableC', 'tableD'],
            link: ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2'],
            where: 'tableB.fieldB = 0 AND tableC.fieldC1 = 1',
        }

        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(element);
        const relationChain = relationChainBuilder.build();

        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(element);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);
        linker.link();
        const expandedTree = linker.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree, serviceLookup);
        generator.generate();

        const executionPlan = generator.getExecutionPlan();

        expect(executionPlan).to.be.deep.equal({
            "dependency": {},
            "operation": 0,
            "with": [
                "tableC",
                "tableB"
            ],
            "link": [
                "tableC.fieldC=tableB.fieldB1",
                "tableB.fieldB2=tableA.fieldA2"
            ],
            "orderBy": undefined,
            "limit": undefined,
            "query": "tableA",
            "where": "(tableB.fieldB = 0 AND tableC.fieldC1 = 1)"
        });
    });

    it('should generate execution plan for expression tree with the different service', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: ['tableB', 'tableC', 'tableD'],
            link: ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2'],
            where: 'tableB.fieldB = 0 AND tableD.fieldD = 1',
        }

        when(mockIdGenerator.nano8()).thenReturn('12345678');
        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(element);
        const relationChain = relationChainBuilder.build();

        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(element);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);
        linker.link();
        const expandedTree = linker.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree, serviceLookup);
        generator.generate();

        const executionPlan = generator.getExecutionPlan();

        expect(executionPlan).to.be.deep.equal({
            "dependency": {
                "12345678": {
                    "dependency": {},
                    "operation": 0,
                    "with": [],
                    "link": [],
                    "orderBy": undefined,
                    "limit": undefined,
                    "query": "tableD.fieldD",
                    "where": "tableD.fieldD = 1"
                }
            },
            "operation": 0,
            "with": [
                "tableB"
            ],
            "link": [
                "tableB.fieldB2=tableA.fieldA2"
            ],
            "orderBy": undefined,
            "limit": undefined,
            "query": "tableA",
            "where": "(tableB.fieldB = 0 AND tableA.fieldA1 IN {12345678})"
        });
    });

    it('should generate execution plan for complex expression tree 1', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: ['tableB', 'tableC', 'tableD'],
            link: ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2'],
            where: 'tableD.fieldD1 = 0 AND tableD.fieldD2 = 1 AND (tableC.fieldC1 = 2 OR tableB.fieldB = 3)',
        }

        when(mockIdGenerator.nano8()).thenReturn('12345678');
        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(element);
        const relationChain = relationChainBuilder.build();

        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(element);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);
        linker.link();
        const expandedTree = linker.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree, serviceLookup);
        generator.generate();

        const executionPlan = generator.getExecutionPlan();

        expect(executionPlan).to.be.deep.equal({
            "dependency": {
                "12345678": {
                    "dependency": {},
                    "operation": 0,
                    "with": [],
                    "link": [],
                    "orderBy": undefined,
                    "limit": undefined,
                    "query": "tableD.fieldD",
                    "where": "(tableD.fieldD1 = 0 AND tableD.fieldD2 = 1)"
                }
            },
            "operation": 0,
            "with": [
                "tableC",
                "tableB"
            ],
            "link": [
                "tableC.fieldC=tableB.fieldB1",
                "tableB.fieldB2=tableA.fieldA2"
            ],
            "orderBy": undefined,
            "limit": undefined,
            "query": "tableA",
            "where": "(tableA.fieldA1 IN {12345678} AND (tableC.fieldC1 = 2 OR tableB.fieldB = 3))"
        });
    });

    it('should generate execution plan for complex expression tree 2', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: ['tableB', 'tableC', 'tableD'],
            link: ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2'],
            where: 'tableD.fieldD1 = 0 AND tableC.fieldC1 = 2 AND (tableD.fieldD2 = 1 OR tableB.fieldB = 3)',
            orderBy: ['tableA.fieldA3 DESC'],
            limit: [0, 100]
        }

        when(mockIdGenerator.nano8()).thenReturn('12345678').thenReturn('23456789');
        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(element);
        const relationChain = relationChainBuilder.build();

        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(element);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);
        linker.link();
        const expandedTree = linker.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree, serviceLookup);
        generator.generate();

        const executionPlan = generator.getExecutionPlan();

        expect(executionPlan).to.be.deep.equal({
            "dependency": {
                "12345678": {
                    "dependency": {},
                    "operation": 0,
                    "with": [],
                    "link": [],
                    "orderBy": undefined,
                    "limit": undefined,
                    "query": "tableD.fieldD",
                    "where": "tableD.fieldD1 = 0"
                },
                "23456789": {
                    "dependency": {},
                    "operation": 0,
                    "with": [],
                    "link": [],
                    "orderBy": undefined,
                    "limit": undefined,
                    "query": "tableD.fieldD",
                    "where": "tableD.fieldD2 = 1"
                }
            },
            "operation": 0,
            "with": [
                "tableC",
                "tableB"
            ],
            "link": [
                "tableC.fieldC=tableB.fieldB1",
                "tableB.fieldB2=tableA.fieldA2"
            ],
            "orderBy": ['tableA.fieldA3 DESC'],
            "limit": [0, 100],
            "query": "tableA",
            "where": "((tableA.fieldA1 IN {12345678} AND tableC.fieldC1 = 2) AND (tableA.fieldA1 IN {23456789} OR tableB.fieldB = 3))"
        });
    });

    after(() => {
        reset(mockIdGenerator);
    });
});
import 'mocha';
import { expect } from 'chai';
import { reset, when } from 'ts-mockito';
import injector from '../../src/utility/Injector';
import IdGenerator from '../../src/utility/IdGenerator';
import QueryChainBuilder from '../../src/query-chain/QueryChainBuilder';
import RelationExpander from '../../src/relation-expand/RelationExpander';
import IExpressionTreeNode from '../../src/expression-tree/ExpressionTreeNode';
import ExpressionTreeParser from '../../src/expression-tree/ExpressionTreeParser';
import ExecutionPlanGenerator from '../../src/execution-plan/ExecutionPlanGenerator';

const mockIdGenerator: IdGenerator = injector.get<IdGenerator>('MockIdGenerator');

describe('ExecutionPlanGenerator', () => {
    it('should generate execution plan for single condition', () => {
        const queryChainBuilder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const queryChain = queryChainBuilder.build();

        const whereStr: string = 'tableA.fieldA != 0';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(whereStr);

        const expander: RelationExpander = new RelationExpander(expressionTree, queryChain);
        expander.expand();
        expander.finalize('tableA');
        const expandedTree = expander.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree);
        generator.generate();

        const executionPlan = generator.getExecutionPlan();

        expect(executionPlan).to.be.deep.equal({
            "dependency": {},
            "from": [
                "tableA"
            ],
            "link": [],
            "select": "tableA",
            "where": "tableA.fieldA != 0"
        });
    });

    it('should generate execution plan for condition and relation from the same service', () => {
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
        expander.expand();
        expander.finalize('tableA');
        const expandedTree = expander.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree);
        generator.generate();

        const executionPlan = generator.getExecutionPlan();

        expect(executionPlan).to.be.deep.equal({
            "dependency": {},
            "from": [
                "tableC",
                "tableB",
                "tableA"
            ],
            "link": ['tableC.fieldC=tableB.fieldB1', 'tableB.fieldB2=tableA.fieldA2'],
            "select": "tableA",
            "where": "(tableC.fieldC1 & 2) != 0"
        });
    });

    it('should generate execution plan for condition and relation from the different service', () => {
        when(mockIdGenerator.nano8()).thenReturn('12345678');
        const queryChainBuilder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const queryChain = queryChainBuilder.build();

        const whereStr: string = 'tableD.fieldD1 != 0';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(whereStr);

        const expander: RelationExpander = new RelationExpander(expressionTree, queryChain);
        expander.expand();
        expander.finalize('tableA');
        const expandedTree = expander.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree);
        generator.generate();

        const executionPlan = generator.getExecutionPlan();

        expect(executionPlan).to.be.deep.equal({
            "dependency": {
                "12345678": {
                    "dependency": {},
                    "from": [
                        "tableD"
                    ],
                    "link": [],
                    "select": "tableD.fieldD",
                    "where": "tableD.fieldD1 != 0"
                }
            },
            "from": [
                "tableA"
            ],
            "link": [],
            "select": "tableA",
            "where": "tableA.fieldA1 IN {12345678}"
        });
    });

    it('should generate execution plan for condition and relation with recursive dependency', () => {
        when(mockIdGenerator.nano8()).thenReturn('12345678').thenReturn('23456789');
        const queryChainBuilder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableD.fieldD2', 'tableD.fieldD1=tableB.fieldB1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const queryChain = queryChainBuilder.build();

        const whereStr: string = 'tableC.fieldC1 != 0';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(whereStr);

        const expander: RelationExpander = new RelationExpander(expressionTree, queryChain);
        expander.expand();
        expander.finalize('tableA');
        const expandedTree = expander.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree);
        generator.generate();

        const executionPlan = generator.getExecutionPlan();

        expect(executionPlan).to.be.deep.equal({
            "dependency": {
                "23456789": {
                    "dependency": {
                        "12345678": {
                            "dependency": {},
                            "from": [
                                "tableC"
                            ],
                            "link": [],
                            "select": "tableC.fieldC",
                            "where": "tableC.fieldC1 != 0"
                        }
                    },
                    "from": [
                        "tableD"
                    ],
                    "link": [],
                    "select": "tableD.fieldD1",
                    "where": "tableD.fieldD2 IN {12345678}"
                }
            },
            "from": [
                "tableB",
                "tableA"
            ],
            "link": [
                "tableB.fieldB2=tableA.fieldA2"
            ],
            "select": "tableA",
            "where": "tableB.fieldB1 IN {23456789}"
        });
    });

    it('should generate execution plan for expression tree from the same service', () => {
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
        expander.expand();
        expander.finalize('tableA');
        const expandedTree = expander.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree);
        generator.generate();

        const executionPlan = generator.getExecutionPlan();

        expect(executionPlan).to.be.deep.equal({
            "dependency": {},
            "from": [
                "tableB",
                "tableC",
                "tableA"
            ],
            "link": [
                "tableC.fieldC=tableB.fieldB1",
                "tableB.fieldB2=tableA.fieldA2"
            ],
            "select": "tableA",
            "where": "(tableB.fieldB = 0 AND tableC.fieldC1 = 1)"
        });
    });

    it('should generate execution plan for expression tree from the different service', () => {
        when(mockIdGenerator.nano8()).thenReturn('12345678');
        const queryChainBuilder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const queryChain = queryChainBuilder.build();

        const whereStr: string = 'tableB.fieldB = 0 AND tableD.fieldD = 1';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(whereStr);

        const expander: RelationExpander = new RelationExpander(expressionTree, queryChain);
        expander.expand();
        expander.finalize('tableA');
        const expandedTree = expander.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree);
        generator.generate();

        const executionPlan = generator.getExecutionPlan();

        expect(executionPlan).to.be.deep.equal({
            "dependency": {
                "12345678": {
                    "dependency": {},
                    "from": [
                        "tableD"
                    ],
                    "link": [],
                    "select": "tableD.fieldD",
                    "where": "tableD.fieldD = 1"
                }
            },
            "from": [
                "tableB",
                "tableA"
            ],
            "link": [
                "tableB.fieldB2=tableA.fieldA2"
            ],
            "select": "tableA",
            "where": "(tableB.fieldB = 0 AND tableA.fieldA1 IN {12345678})"
        });
    });

    it('should generate execution plan for complex expression tree 1', () => {
        when(mockIdGenerator.nano8()).thenReturn('12345678');
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
        expander.expand();
        expander.finalize('tableA');
        const expandedTree = expander.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree);
        generator.generate();

        const executionPlan = generator.getExecutionPlan();

        expect(executionPlan).to.be.deep.equal({
            "dependency": {
                "12345678": {
                    "dependency": {},
                    "from": [
                        "tableD"
                    ],
                    "link": [],
                    "select": "tableD.fieldD",
                    "where": "(tableD.fieldD1 = 0 AND tableD.fieldD2 = 1)"
                }
            },
            "from": [
                "tableA",
                "tableC",
                "tableB"
            ],
            "link": [
                "tableC.fieldC=tableB.fieldB1",
                "tableB.fieldB2=tableA.fieldA2"
            ],
            "select": "tableA",
            "where": "(tableA.fieldA1 IN {12345678} AND (tableC.fieldC1 = 2 OR tableB.fieldB = 3))"
        });
    });

    it('should generate execution plan for complex expression tree 2', () => {
        when(mockIdGenerator.nano8()).thenReturn('12345678').thenReturn('23456789');
        const queryChainBuilder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );
        const queryChain = queryChainBuilder.build();

        const whereStr: string = 'tableD.fieldD1 = 0 AND tableC.fieldC1 = 2 AND (tableD.fieldD2 = 1 OR tableB.fieldB = 3)';
        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(whereStr);

        const expander: RelationExpander = new RelationExpander(expressionTree, queryChain);
        expander.expand();
        expander.finalize('tableA');
        const expandedTree = expander.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree);
        generator.generate();

        const executionPlan = generator.getExecutionPlan();

        expect(executionPlan).to.be.deep.equal({
            "dependency": {
                "12345678": {
                    "dependency": {},
                    "from": [
                        "tableD"
                    ],
                    "link": [],
                    "select": "tableD.fieldD",
                    "where": "tableD.fieldD1 = 0"
                },
                "23456789": {
                    "dependency": {},
                    "from": [
                        "tableD"
                    ],
                    "link": [],
                    "select": "tableD.fieldD",
                    "where": "tableD.fieldD2 = 1"
                }
            },
            "from": [
                "tableA",
                "tableC",
                "tableB"
            ],
            "link": [
                "tableC.fieldC=tableB.fieldB1",
                "tableB.fieldB2=tableA.fieldA2"
            ],
            "select": "tableA",
            "where": "((tableA.fieldA1 IN {12345678} AND tableC.fieldC1 = 2) AND (tableA.fieldA1 IN {23456789} OR tableB.fieldB = 3))"
        });
    });

    after(() => {
        reset(mockIdGenerator);
    });
});
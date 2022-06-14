import 'mocha';
import { expect } from 'chai';
import { reset, when } from 'ts-mockito';
import * as MockFetch from '../test-data/MockFetchProxy';

import injector from '../../src/utility/Injector';
import IdGenerator from '../../src/utility/IdGenerator';
import ServiceLookup from '../../src/lookup/ServiceLookup';
import PlanExecutor from '../../src/plan-executor/PlanExecutor';
import RelationLinker from '../../src/relation-linking/RelationLinker';
import IUnifyQLElement from '../../src/unify-ql-element/IUnifyQLElement';
import EUnifyQLOperation from '../../src/unify-ql-element/EUnifyQLOperation';
import IExpressionTreeNode from '../../src/expression-tree/ExpressionTreeNode';
import RelationChainBuilder from '../../src/relation-chain/RelationChainBuilder';
import ExpressionTreeParser from '../../src/expression-tree/ExpressionTreeParser';
import ExecutionPlanGenerator from '../../src/execution-plan/ExecutionPlanGenerator';

const mockIdGenerator: IdGenerator = injector.get<IdGenerator>('MockIdGenerator');
const serviceLookup: ServiceLookup = new ServiceLookup();

describe('PlanExecutor', () => {
    it('should execute query with no condition', async () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: [],
            link: [],
            where: '',
            orderBy: ['tableA.fieldA2 DESC'],
            limit: [0, 100]
        }

        MockFetch.setJsonResult(200, [{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);
        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(element);
        const relationChain = relationChainBuilder.build();

        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(element)!;

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);
        linker.link();
        const expandedTree = linker.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree, serviceLookup);
        generator.generate();

        const executionPlan = generator.getExecutionPlan()!;

        const executor = new PlanExecutor('root', executionPlan, serviceLookup);
        const result = await executor.execute();

        expect(result.id).to.be.equal('root');
        expect(result.data).to.be.deep.equal([{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);

        const queryReq = MockFetch.requests[0];

        expect(queryReq.reqUrl).to.be.equal('http://localhost:5000/query');
        expect(queryReq.reqOption.body).to.be.equal('QUERY tableA ORDER BY tableA.fieldA2 DESC LIMIT 0, 100');
    });

    it('should execute query with special query', async () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Sum,
            queryTarget: 'tableA',
            queryField: 'fieldA3',
            with: [],
            link: [],
            where: '',
            orderBy: ['tableA.fieldA2 DESC'],
            limit: [0, 100]
        }

        MockFetch.setJsonResult(200, [{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);
        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(element);
        const relationChain = relationChainBuilder.build();

        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(element)!;

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);
        linker.link();
        const expandedTree = linker.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree, serviceLookup);
        generator.generate();

        const executionPlan = generator.getExecutionPlan()!;

        const executor = new PlanExecutor('root', executionPlan, serviceLookup);
        const result = await executor.execute();

        expect(result.id).to.be.equal('root');
        expect(result.data).to.be.deep.equal([{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);

        const queryReq = MockFetch.requests[0];

        expect(queryReq.reqUrl).to.be.equal('http://localhost:5000/query');
        expect(queryReq.reqOption.body).to.be.equal('SUM tableA.fieldA3 ORDER BY tableA.fieldA2 DESC LIMIT 0, 100');
    });


    it('should execute query with condition and relation from the same service', async () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: ['tableB', 'tableC', 'tableD'],
            link: ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2'],
            where: '(tableC.fieldC1 & 2) != 0',
        }

        MockFetch.setJsonResult(200, [{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);
        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(element);
        const relationChain = relationChainBuilder.build();

        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(element);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);
        linker.link();
        const expandedTree = linker.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree, serviceLookup);
        generator.generate();

        const executionPlan = generator.getExecutionPlan()!;

        const executor = new PlanExecutor('root', executionPlan, serviceLookup);
        const result = await executor.execute();

        expect(result.id).to.be.equal('root');
        expect(result.data).to.be.deep.equal([{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);

        const queryReq = MockFetch.requests[0];

        expect(queryReq.reqUrl).to.be.equal('http://localhost:5000/query');
        expect(queryReq.reqOption.body).to.be.equal('QUERY tableA WITH tableC,tableB LINK tableC.fieldC=tableB.fieldB1,tableB.fieldB2=tableA.fieldA2 WHERE (tableC.fieldC1 & 2) != 0');
    });

    it('should execute query with condition and relation from the different service', async () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: ['tableB', 'tableC', 'tableD'],
            link: ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2'],
            where: 'tableD.fieldD1 != 0',
        }

        MockFetch.setJsonResult(200, [{ fieldD: 1 }, { fieldD: 2 }, { fieldD: 3 }, { fieldD: 4 }]);
        MockFetch.setJsonResult(200, [{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);
        const relationChainBuilder: RelationChainBuilder = new RelationChainBuilder(element);
        const relationChain = relationChainBuilder.build();

        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(element);

        const linker: RelationLinker = new RelationLinker(expressionTree, relationChain);
        linker.link();
        const expandedTree = linker.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree, serviceLookup);
        generator.generate();

        const executionPlan = generator.getExecutionPlan()!;

        const executor = new PlanExecutor('root', executionPlan, serviceLookup);
        const result = await executor.execute();

        expect(result.id).to.be.equal('root');
        expect(result.data).to.be.deep.equal([{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);

        const queryReq1 = MockFetch.requests[0];
        const queryReq2 = MockFetch.requests[1];

        expect(queryReq1.reqUrl).to.be.equal('http://localhost:4999/query');
        expect(queryReq1.reqOption.body).to.be.equal('QUERY tableD.fieldD WHERE tableD.fieldD1 != 0');

        expect(queryReq2.reqUrl).to.be.equal('http://localhost:5000/query');
        expect(queryReq2.reqOption.body).to.be.equal('QUERY tableA WHERE tableA.fieldA1 IN (1,2,3,4)');
    });

    it('should execute query with recursive dependency', async () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: ['tableB', 'tableC', 'tableD'],
            link: ['tableC.fieldC=tableD.fieldD2', 'tableD.fieldD1=tableB.fieldB1', 'tableA.fieldA2=tableB.fieldB2'],
            where: 'tableC.fieldC1 != 0',
        }

        MockFetch.setJsonResult(200, [{ fieldC: 'A' }, { fieldC: 'B' }, { fieldC: 'C' }, { fieldC: 'D' }]);
        MockFetch.setJsonResult(200, [{ fieldD1: 1 }, { fieldD1: 2 }, { fieldD1: 3 }, { fieldD1: 4 }]);
        MockFetch.setJsonResult(200, [{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);
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

        const executionPlan = generator.getExecutionPlan()!;

        const executor = new PlanExecutor('root', executionPlan, serviceLookup);
        const result = await executor.execute();

        expect(result.id).to.be.equal('root');
        expect(result.data).to.be.deep.equal([{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);

        const queryReq1 = MockFetch.requests[0];
        const queryReq2 = MockFetch.requests[1];
        const queryReq3 = MockFetch.requests[2];

        expect(queryReq1.reqUrl).to.be.equal('http://localhost:5000/query');
        expect(queryReq1.reqOption.body).to.be.equal('QUERY tableC.fieldC WHERE tableC.fieldC1 != 0');

        expect(queryReq2.reqUrl).to.be.equal('http://localhost:4999/query');
        expect(queryReq2.reqOption.body).to.be.equal('QUERY tableD.fieldD1 WHERE tableD.fieldD2 IN ("A","B","C","D")');

        expect(queryReq3.reqUrl).to.be.equal('http://localhost:5000/query');
        expect(queryReq3.reqOption.body).to.be.equal('QUERY tableA WITH tableB LINK tableB.fieldB2=tableA.fieldA2 WHERE tableB.fieldB1 IN (1,2,3,4)');
    });

    it('should execute query with complex expression tree', async () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: ['tableB', 'tableC', 'tableD'],
            link: ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2'],
            where: 'tableD.fieldD1 = 0 AND tableC.fieldC1 = 2 AND (tableD.fieldD2 = 1 OR tableB.fieldB = 3)',
        }

        MockFetch.setJsonResult(200, [{ fieldD: 1 }, { fieldD: 2 }, { fieldD: 3 }, { fieldD: 4 }]);
        MockFetch.setJsonResult(200, [{ fieldD: 5 }, { fieldD: 6 }, { fieldD: 7 }, { fieldD: 8 }]);
        MockFetch.setJsonResult(200, [{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);
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

        const executionPlan = generator.getExecutionPlan()!;

        const executor = new PlanExecutor('root', executionPlan, serviceLookup);
        const result = await executor.execute();

        expect(result.id).to.be.equal('root');
        expect(result.data).to.be.deep.equal([{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);

        const queryReq1 = MockFetch.requests[0];
        const queryReq2 = MockFetch.requests[1];
        const queryReq3 = MockFetch.requests[2];

        expect(queryReq1.reqUrl).to.be.equal('http://localhost:4999/query');
        expect(queryReq1.reqOption.body).to.be.equal('QUERY tableD.fieldD WHERE tableD.fieldD1 = 0');

        expect(queryReq2.reqUrl).to.be.equal('http://localhost:4999/query');
        expect(queryReq2.reqOption.body).to.be.equal('QUERY tableD.fieldD WHERE tableD.fieldD2 = 1');

        expect(queryReq3.reqUrl).to.be.equal('http://localhost:5000/query');
        expect(queryReq3.reqOption.body).to.be.equal('QUERY tableA WITH tableC,tableB LINK tableC.fieldC=tableB.fieldB1,tableB.fieldB2=tableA.fieldA2 WHERE ((tableA.fieldA1 IN (1,2,3,4) AND tableC.fieldC1 = 2) AND (tableA.fieldA1 IN (5,6,7,8) OR tableB.fieldB = 3))');
    });

    afterEach(() => {
        MockFetch.clearResult();
        reset(mockIdGenerator);
    });
});
import 'mocha';
import { expect } from 'chai';

import IExecutionPlan from "../../src/execution-plan/IExecutionPlan";
import ExecutionPlanUQLConverter from "../../src/plan-executor/ExecutionPlanUQLConverter";

const converter: ExecutionPlanUQLConverter = new ExecutionPlanUQLConverter();

describe('ExecutionPlanUQLConverter', () => {
    it('should convert execution plan to UQL', () => {
        const plan: IExecutionPlan = {
            "dependency": {},
            "with": ["tableB"],
            "link": ["tableA.fieldA=tableB.fieldB"],
            "orderBy": ['tableA.fieldA3 DESC'],
            "limit": [0, 100],
            "query": "tableA",
            "where": "tableA.fieldA1=1"
        };
        const uql = converter.convert(plan, {});
        expect(uql).to.be.equal('QUERY tableA WITH tableB LINK tableA.fieldA=tableB.fieldB WHERE tableA.fieldA1=1 ORDER BY tableA.fieldA3 DESC LIMIT 0, 100');
    });

    it('should convert execution plan to UQL with dependency', () => {
        const plan: IExecutionPlan = {
            "dependency": {},
            "with": ["tableB"],
            "link": ["tableA.fieldA=tableB.fieldB"],
            "query": "tableA",
            "where": "tableA.fieldA1 IN {12345678} AND tableA.fieldA2 IN {23456789}"
        };
        const uql = converter.convert(plan, { "12345678": [1, 2, 3], "23456789": ["a", "b", "c"] });
        expect(uql).to.be.equal('QUERY tableA WITH tableB LINK tableA.fieldA=tableB.fieldB WHERE tableA.fieldA1 IN (1,2,3) AND tableA.fieldA2 IN ("a","b","c")');
    });

    it('should convert execution plan to UQL query only', () => {
        const plan: IExecutionPlan = {
            "dependency": {},
            "with": [],
            "link": [],
            "query": "tableA",
            "where": ""
        };
        const uql = converter.convert(plan, {});
        expect(uql).to.be.equal('QUERY tableA');
    });
});
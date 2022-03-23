import IUnifyQL from "./IUnifyQL";

import PlanExecutor from "../plan-executor/PlanExecutor";
import QueryChainBuilder from "../query-chain/QueryChainBuilder";
import RelationExpander from "../relation-expand/RelationExpander";
import IExpressionTreeNode from "../expression-tree/ExpressionTreeNode";
import ExpressionTreeParser from "../expression-tree/ExpressionTreeParser";
import ExecutionPlanGenerator from "../execution-plan/ExecutionPlanGenerator";

interface IQLElement {
    queryTarget: string;
    with: string[];
    link: string[];
    where: string;
    orderBy?: string[];
    limit?: number[];
}

class UnifyQL implements IUnifyQL {

    constructor() { }

    public async query(queryStr: string): Promise<any> {
        const element = this.extractQLElement(queryStr);

        const queryChainBuilder: QueryChainBuilder = new QueryChainBuilder(element.queryTarget, element.with, element.link);
        const queryChain = queryChainBuilder.build();

        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse('tableA', element.where, element.orderBy, element.limit);

        const expander: RelationExpander = new RelationExpander(expressionTree, queryChain);
        expander.expand();
        const expandedTree = expander.getResult();

        const generator: ExecutionPlanGenerator = new ExecutionPlanGenerator(expandedTree);
        generator.generate();

        const executionPlan = generator.getExecutionPlan()!;

        const executor = new PlanExecutor('root', executionPlan);
        const result = await executor.execute();

        return result.data;
    }

    private extractQLElement(queryStr: string): IQLElement {
        const result: IQLElement = {
            queryTarget: '',
            with: [],
            link: [],
            where: ''
        }

        const regex: RegExp = /\s*(QUERY|WITH|LINK|WHERE|ORDER BY|LIMIT)\s*/gm;
        const splitQueryStr: string[] = queryStr.split(regex).filter(e => e !== '');
        for (let i = 0; i < splitQueryStr.length; i += 2) {
            const keyword = splitQueryStr[i];
            const value = splitQueryStr[i + 1];
            switch (keyword) {
                case 'QUERY':
                    result.queryTarget = value;
                    break;
                case 'WITH':
                    result.with = value.split(/\s*,\s*/);
                    break;
                case 'LINK':
                    result.link = value.split(/\s*,\s*/);
                    break;
                case 'WHERE':
                    result.where = value;
                    break;
                case 'ORDER BY':
                    result.orderBy = value.split(/\s*,\s*/);
                    break;
                case 'LIMIT':
                    result.limit = value.split(/\s*,\s*/).map(e => parseInt(e));
                    break;
            }
        }

        return result;
    }
}

export default UnifyQL;
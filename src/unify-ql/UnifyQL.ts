import IUnifyQL from "./IUnifyQL";

import injector from "../utility/Injector";
import PlanExecutor from "../plan-executor/PlanExecutor";
import QueryChainBuilder from "../query-chain/QueryChainBuilder";
import RelationExpander from "../relation-expand/RelationExpander";
import IExpressionTreeNode from "../expression-tree/ExpressionTreeNode";
import extractQLElement from "../unify-ql-element/ExtractUnifyQlElement";
import IServiceConfigSource from "../service-config/IServiceConfigSource";
import ExpressionTreeParser from "../expression-tree/ExpressionTreeParser";
import ExecutionPlanGenerator from "../execution-plan/ExecutionPlanGenerator";

class UnifyQL implements IUnifyQL {

    constructor(serviceConfigSource: IServiceConfigSource) {
        injector.set('ServiceConfigSource', serviceConfigSource);
    }

    public async query(unifyQl: string): Promise<any> {
        const element = extractQLElement(unifyQl);
        const queryChainBuilder: QueryChainBuilder = new QueryChainBuilder(element.queryTarget, element.with, element.link);
        const queryChain = queryChainBuilder.build();

        const parser: ExpressionTreeParser = new ExpressionTreeParser();
        const expressionTree: IExpressionTreeNode = parser.parse(element.queryTarget, element.where, element.orderBy, element.limit);

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
}

export default UnifyQL;
import IUnifyQL from "./IUnifyQL";

import injector from "../utility/Injector";
import ServiceLookup from "../lookup/ServiceLookup";
import PlanExecutor from "../plan-executor/PlanExecutor";
import RelationLinker from "../relation-linking/RelationLinker";
import IExpressionTreeNode from "../expression-tree/ExpressionTreeNode";
import RelationChainBuilder from "../relation-chain/RelationChainBuilder";
import extractQLElement from "../unify-ql-element/ExtractUnifyQlElement";
import IServiceConfigSource from "../service-config/IServiceConfigSource";
import ExpressionTreeParser from "../expression-tree/ExpressionTreeParser";
import ExecutionPlanGenerator from "../execution-plan/ExecutionPlanGenerator";

class UnifyQL implements IUnifyQL {

    constructor(serviceConfigSource: IServiceConfigSource) {
        injector.set('ServiceConfigSource', serviceConfigSource);
    }

    public async query(unifyQl: string): Promise<any> {
        const serviceLookup: ServiceLookup = new ServiceLookup();
        const element = extractQLElement(unifyQl.replaceAll('\n', ' '));
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

        return result.data;
    }
}

export default UnifyQL;
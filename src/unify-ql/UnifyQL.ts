import * as crypto from "crypto";

import IUnifyQL from "./IUnifyQL";

import injector from "../utility/Injector";
import ServiceLookup from "../lookup/ServiceLookup";
import PlanExecutor from "../plan-executor/PlanExecutor";
import IExecutionPlanCache from '../cache/IExecutionPlanCache';
import RelationLinker from "../relation-linking/RelationLinker";
import IExpressionTreeNode from "../expression-tree/ExpressionTreeNode";
import extractQLElement from "../unify-ql-element/ExtractUnifyQlElement";
import RelationChainBuilder from "../relation-chain/RelationChainBuilder";
import IServiceConfigSource from "../service-config/IServiceConfigSource";
import ExpressionTreeParser from "../expression-tree/ExpressionTreeParser";
import ExecutionPlanGenerator from "../execution-plan/ExecutionPlanGenerator";

class UnifyQL implements IUnifyQL {

    constructor(serviceConfigSource: IServiceConfigSource, cache?: IExecutionPlanCache) {
        injector.set('ServiceConfigSource', serviceConfigSource);
        if (cache !== undefined) {
            injector.set('ExecutionPlanCache', cache);
        }
    }

    public async query(unifyQl: string): Promise<any> {
        const serviceLookup: ServiceLookup = new ServiceLookup();

        const sha = crypto.createHash('sha256').update(unifyQl).digest('base64');

        if (injector.exist('ExecutionPlanCache')) {
            const cache = injector.get<IExecutionPlanCache>('ExecutionPlanCache');
            if (cache.exist(sha)) {
                const executionPlan = cache.get(sha);

                const executor = new PlanExecutor('root', executionPlan, serviceLookup);
                const result = await executor.execute();
                return result.data;
            }
        }

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

        if (injector.exist('ExecutionPlanCache')) {
            const cache = injector.get<IExecutionPlanCache>('ExecutionPlanCache');
            cache.set(sha, executionPlan);
        }

        return result.data;
    }
}

export default UnifyQL;
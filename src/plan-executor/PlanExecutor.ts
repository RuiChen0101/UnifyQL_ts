import injector from "../utility/Injector";
import FetchProxy from "../utility/FetchProxy";
import IExecutionResult from "./IExecutionResult";
import ServiceLookup from "../lookup/ServiceLookup";
import IExecutionPlan from "../execution-plan/IExecutionPlan";
import ExecutionPlanUQLConverter from "./ExecutionPlanUQLConverter";
import PlanExecutorException from "../exception/PlanExecutorException";

class PlanExecutor {
    private _id: string;
    private _executionPlan: IExecutionPlan;
    private _serviceLookup: ServiceLookup;

    constructor(id: string, executionPlan: IExecutionPlan, serviceLookup: ServiceLookup) {
        this._id = id;
        this._executionPlan = executionPlan;
        this._serviceLookup = serviceLookup;
    }

    public async execute(): Promise<IExecutionResult> {
        const rootPlan = this._executionPlan;
        const dependencyIds: string[] = Object.keys(rootPlan.dependency);
        const dependencyResult: { [key: string]: any } = {};
        if (dependencyIds.length !== 0) {
            const executionPromises: Promise<IExecutionResult>[] = [];
            for (const dependencyId of dependencyIds) {
                const executor = new PlanExecutor(dependencyId, rootPlan.dependency[dependencyId], this._serviceLookup);
                executionPromises.push(executor.execute());
            }
            const results: IExecutionResult[] = await Promise.all(executionPromises);
            for (const result of results) {
                dependencyResult[result.id] = result.data;
            }
        };
        const splitQuery = rootPlan.query.split('.');
        const targetTable = splitQuery[0];
        const targetField: string | undefined = splitQuery[1];
        const serviceName: string = this._serviceLookup.getServiceNameByTable(targetTable);
        const requestUrl: string = this._serviceLookup.getServiceConfig(serviceName).url;

        const converter = new ExecutionPlanUQLConverter();
        const uql = converter.convert(rootPlan, dependencyResult);

        const res = await injector.get<FetchProxy>('FetchProxy').fetch(requestUrl, {
            method: 'POST',
            body: uql
        });

        if (res.status === 404) {
            return { id: this._id, data: [] };
        } else if (res.status >= 400) {
            throw new PlanExecutorException(`Service ${serviceName} response ${res.status} when executing ${uql}`);
        }

        const data: any[] = (await res.json()) as any[];

        if (targetField === undefined || this._id === 'root') {
            return {
                id: this._id,
                data: data
            }
        } else {
            return {
                id: this._id,
                data: data.map(e => e[targetField])
            }
        }
    }
}

export default PlanExecutor;
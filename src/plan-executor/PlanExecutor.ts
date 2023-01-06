import injector from "../utility/Injector";
import IExecutionResult from "./IExecutionResult";
import ServiceLookup from "../lookup/ServiceLookup";
import IExecutionPlan from "../execution-plan/IExecutionPlan";
import IRequestManager from "../request-manager/IRequestManager";
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
        const executionPromises: Promise<IExecutionResult>[] = [];
        for (const dependencyId of dependencyIds) {
            const executor = new PlanExecutor(dependencyId, rootPlan.dependency[dependencyId], this._serviceLookup);
            executionPromises.push(executor.execute());
        }
        const results: IExecutionResult[] = await Promise.all(executionPromises);
        for (const result of results) {
            dependencyResult[result.id] = result.data;
        }
        const splitQuery = rootPlan.query.split('.');
        const targetTable = splitQuery[0];
        const targetField: string | undefined = splitQuery[1];
        const serviceName: string = this._serviceLookup.getServiceNameByTable(targetTable);
        const requestUrl: string = this._serviceLookup.getServiceConfig(serviceName).url;

        const converter = new ExecutionPlanUQLConverter();
        const uql = converter.convert(rootPlan, dependencyResult);

        const response = await injector.get<IRequestManager>('RequestManager').request(
            requestUrl,
            uql,
        );

        if (response.status === 404) {
            return { id: this._id, data: [] };
        } else if (response.status >= 400) {
            throw new PlanExecutorException(`Service ${serviceName} response ${response.status} when executing ${uql}`);
        }

        const data: any[] = response.data;

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
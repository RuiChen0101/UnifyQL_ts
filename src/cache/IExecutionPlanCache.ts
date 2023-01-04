import IExecutionPlan from '../execution-plan/IExecutionPlan';

interface IExecutionPlanCache {
    set(key: string, plan: IExecutionPlan): void;
    get(key: string): IExecutionPlan;
    exist(key: string): boolean;
    freeSpace(): void;
}

export default IExecutionPlanCache;
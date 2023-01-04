import IExecutionPlanCache from './IExecutionPlanCache';
import IExecutionPlan from '../execution-plan/IExecutionPlan';

class DefaultExecutionPlanCache implements IExecutionPlanCache {
    private _cache: { [key: string]: IExecutionPlan } = {};

    public set(key: string, plan: IExecutionPlan): void {
        this._cache[key] = plan;
    }

    public get(key: string): IExecutionPlan {
        return this._cache[key];
    }

    public exist(key: string): boolean {
        return key in this._cache;
    }

    public freeSpace(): void {
        this._cache = {};
    }
}

export default DefaultExecutionPlanCache;
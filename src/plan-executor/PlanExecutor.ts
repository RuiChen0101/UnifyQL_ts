import IExecutionPlan from "../execution-plan/IExecutionPlan";

class PlanExecutor {
    private _executionPlan: IExecutionPlan;

    constructor(executionPlan: IExecutionPlan) {
        this._executionPlan = executionPlan;
    }

    public async execute(): Promise<any> {

    }
}

export default PlanExecutor;
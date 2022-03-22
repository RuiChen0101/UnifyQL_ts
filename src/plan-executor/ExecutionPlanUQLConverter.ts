import IExecutionPlan from "../execution-plan/IExecutionPlan";

class ExecutionPlanUQLConverter {
    public convert(plan: IExecutionPlan, dependency: { [key: string]: any[] }): string {
        const result: string[] = [`QUERY ${plan.query}`];
        if (plan.with.length !== 0) {
            result.push(`WITH ${plan.with.join(',')}`);
        }
        if (plan.link.length !== 0) {
            result.push(`LINK ${plan.link.join(',')}`);
        }
        return result.join(' ');
    }
}

export default ExecutionPlanUQLConverter;
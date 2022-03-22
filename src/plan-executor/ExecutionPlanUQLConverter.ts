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
        if (plan.where !== '') {
            result.push(`WHERE ${this.replaceDependency(plan.where, dependency)}`);
        }
        if (plan.orderBy !== undefined) {
            result.push(`ORDER BY ${plan.orderBy.join(',')}`);
        }
        if (plan.limit !== undefined) {
            result.push(`LIMIT ${plan.limit[0]}, ${plan.limit[1]}`);
        }
        return result.join(' ');
    }

    private replaceDependency(where: string, dependency: { [key: string]: any[] }): string {
        let result: string = where;
        const dependencyIds: string[] = Object.keys(dependency);
        if (dependencyIds.length === 0) return result;
        for (const dependencyId of dependencyIds) {
            const data: any[] = dependency[dependencyId];
            let replaceWith = '';
            if (data.length === 0) replaceWith = '("")';
            replaceWith = '(' + data.map(e => typeof e === 'number' ? e : `"${e}"`).join(',') + ')';
            result = result.replace(`{${dependencyId}}`, replaceWith);
        }
        return result;
    }
}

export default ExecutionPlanUQLConverter;
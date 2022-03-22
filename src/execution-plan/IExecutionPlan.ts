export default interface IExecutionPlan {
    query: string,
    with: string[],
    link: string[],
    where: string,
    orderBy?: string[],
    limit?: number[],
    dependency: { [key: string]: IExecutionPlan }
}
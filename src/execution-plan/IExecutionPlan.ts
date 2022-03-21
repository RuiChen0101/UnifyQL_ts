export default interface IExecutionPlan {
    query: string,
    with: string[],
    link: string[],
    where: string,
    dependency: { [key: string]: IExecutionPlan }
}
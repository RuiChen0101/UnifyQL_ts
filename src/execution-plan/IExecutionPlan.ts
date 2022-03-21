export default interface IExecutionPlan {
    select: string,
    from: string[],
    link: string[],
    where: string,
    dependency: { [key: string]: IExecutionPlan }
}
export default interface IQLElement {
    queryTarget: string;
    with: string[];
    link: string[];
    where: string;
    orderBy?: string[];
    limit?: number[];
}
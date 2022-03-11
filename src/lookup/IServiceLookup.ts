import IServiceConfig from '../data-model/IServiceConfig';

export default interface IServiceLookup {
    getServiceConfig(serviceName: string): IServiceConfig;
    getServiceNameByTable(table: string): string;
    isAllFromSameService(tables: string[]): boolean;
}
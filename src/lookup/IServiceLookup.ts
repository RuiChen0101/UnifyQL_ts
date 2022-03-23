import IServiceConfig from "../service-config/IServiceConfig";

export default interface IServiceLookup {
    getServiceConfig(serviceName: string): IServiceConfig;
    getServiceNameByTable(table: string): string;
    isAllFromSameService(tables: string[]): boolean;
}
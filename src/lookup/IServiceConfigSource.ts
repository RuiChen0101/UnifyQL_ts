import IServiceConfig from "../data-model/IServiceConfig";

export default interface IServiceConfigSource {
    getServiceConfigs(): IServiceConfig[];
    getTableMapping(): { [key: string]: string };
}
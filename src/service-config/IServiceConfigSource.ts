import IServiceConfig from "./IServiceConfig";

export default interface IServiceConfigSource {
    getServiceConfigs(): { [key: string]: IServiceConfig };
    getTableMapping(): { [key: string]: string };
}
import IServiceConfig from '../data-model/IServiceConfig';
import IServiceConfigSource from './IServiceConfigSource';

class FileServiceConfigSource implements IServiceConfigSource {
    private serviceConfigs: { [key: string]: IServiceConfig } = {};
    private tableMapping: { [key: string]: string } = {};

    constructor(fileName: string = '../../res/service_config.json') {
        const fileConfigs: IServiceConfig[] = require(fileName);
        for (const fileConfig of fileConfigs) {
            const serviceName: string = fileConfig.serviceName;
            this.serviceConfigs[serviceName] = fileConfig;
            for (const table of fileConfig.tables) {
                this.tableMapping[table] = serviceName;
            }
        }
    }

    public getServiceConfigs(): { [key: string]: IServiceConfig } {
        return this.serviceConfigs;
    }

    public getTableMapping(): { [key: string]: string } {
        return this.tableMapping;
    }
}

export default FileServiceConfigSource;
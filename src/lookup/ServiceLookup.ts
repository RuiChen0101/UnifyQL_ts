import injector from '../utility/Injector';
import IServiceLookup from './IServiceLookup';
import IServiceConfig from '../service-config/IServiceConfig';
import IServiceConfigSource from '../service-config/IServiceConfigSource';

class ServiceLookup implements IServiceLookup {

    private serviceConfigSource: IServiceConfigSource = injector.get<IServiceConfigSource>('ServiceConfigSource');

    public getServiceConfig(serviceName: string): IServiceConfig {
        return this.serviceConfigSource.getServiceConfigs()[serviceName];
    }

    public getServiceNameByTable(table: string): string {
        return this.serviceConfigSource.getTableMapping()[table];
    }

    public isAllFromSameService(tables: string[]): boolean {
        if (tables === undefined || tables.length === 0) return false;
        let refService: string | undefined = undefined;
        for (const table of tables) {
            if (refService === undefined) {
                refService = this.getServiceNameByTable(table);
            } else if (this.getServiceNameByTable(table) === undefined || refService !== this.getServiceNameByTable(table)) {
                return false;
            }
        }
        return refService !== undefined;
    }
}

export default ServiceLookup;
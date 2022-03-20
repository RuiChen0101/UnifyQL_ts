class Injector {
    private instancesPool: { [key: string]: any } = {}

    private lazyInstancesFactory: { [key: string]: () => any } = {
        ServiceConfigSource: () => new (require('../lookup/FileServiceConfigSource')).default(),
        ServiceLookup: () => new (require('../lookup/ServiceLookup')).default()
    }

    public get<T>(name: string): T {
        if (name in this.instancesPool) {
            return this.instancesPool[name];
        }
        if (!(name in this.lazyInstancesFactory)) {
            throw new Error('Instance not set');
        }
        const instance: T = this.lazyInstancesFactory[name]();
        this.instancesPool[name] = instance;
        return instance;
    }

    public set<T>(name: string, instance: any): T {
        this.instancesPool[name] = instance;
        return instance;
    }

    public setLazy(name: string, instance: () => any): void {
        this.lazyInstancesFactory[name] = instance;
    }

    public remove(name: string): void {
        delete this.instancesPool[name];
    }

    public removeLazy(name: string): void {
        delete this.lazyInstancesFactory[name];
    }
}

const injector = new Injector();

export default injector;
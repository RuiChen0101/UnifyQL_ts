import IdGenerator from './IdGenerator';
import FetchProxy from './FetchProxy';

const instancesPool: { [key: string]: any } = {
    IdGenerator: new IdGenerator(),
    FetchProxy: new FetchProxy()
}

class Injector {
    public get<T>(name: string): T {
        if (name in instancesPool) {
            return instancesPool[name];
        } else {
            throw new Error('Instance not set');
        }
    }

    public set<T>(name: string, instance: any): T {
        instancesPool[name] = instance;
        return instance;
    }

    public exist(name: string): boolean {
        return name in instancesPool;
    }

    public remove(name: string): void {
        delete instancesPool[name];
    }
}

const injector = new Injector();

export default injector;
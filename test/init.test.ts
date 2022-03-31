import 'mocha';
import * as path from 'path';
import { mock, instance } from 'ts-mockito';
import injector from '../src/utility/Injector';

import IdGenerator from '../src/utility/IdGenerator';
import MockFetchProxy from './test-data/MockFetchProxy';
import FileServiceConfigSource from '../src/service-config/FileServiceConfigSource';

const mockIdGenerator: IdGenerator = mock(IdGenerator);
injector.set<IdGenerator>('MockIdGenerator', mockIdGenerator);

injector.set('IdGenerator', instance(mockIdGenerator));

injector.set('FetchProxy', new MockFetchProxy());
injector.set('ServiceConfigSource', new FileServiceConfigSource(path.join(path.resolve(), './test/test-data/test-service-config.json')));

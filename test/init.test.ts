import 'mocha';
import { mock, instance } from 'ts-mockito';
import injector from '../src/utility/Injector';

import FileServiceConfigSource from '../src/lookup/FileServiceConfigSource';
import IdGenerator from '../src/utility/IdGenerator';

const mockIdGenerator: IdGenerator = mock(IdGenerator);
injector.set<IdGenerator>('MockIdGenerator', mockIdGenerator);

injector.set('ServiceConfigSource', new FileServiceConfigSource('../../test/test-data/test-service-config.json'));
injector.set('IdGenerator', instance(mockIdGenerator));
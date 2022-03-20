import 'mocha';
import injector from '../src/utility/Injector';

import FileServiceConfigSource from '../src/lookup/FileServiceConfigSource';

injector.set('ServiceConfigSource', new FileServiceConfigSource('../../test/test-data/test-service-config.json'));
import 'mocha';
import { expect } from 'chai';
import { reset, when } from 'ts-mockito';
import * as MockFetch from '../test-data/MockFetchProxy';

import UnifyQL from '../../src/unify-ql/UnifyQL';
import injector from '../../src/utility/Injector';
import IdGenerator from '../../src/utility/IdGenerator';
import IServiceConfigSource from '../../src/service-config/IServiceConfigSource';

const mockIdGenerator: IdGenerator = injector.get<IdGenerator>('MockIdGenerator');
const serviceConfigSource = injector.get<IServiceConfigSource>('ServiceConfigSource');

describe('UnifyQL', () => {
    it('should execute query without any condition', async () => {
        MockFetch.setJsonResult(200, [{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);

        const uqlStr = 'QUERY tableA';

        const unifyQL = new UnifyQL(serviceConfigSource);
        const result = await unifyQL.query(uqlStr);

        expect(result).to.be.deep.equal([{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);

        const queryReq = MockFetch.requests[0];

        expect(queryReq.reqUrl).to.be.equal('http://localhost:5000/query');
        expect(queryReq.reqOption.body).to.be.equal('QUERY tableA');
    });

    it('should execute query with specify field', async () => {
        MockFetch.setJsonResult(200, [{ fieldA: 'fieldA' }]);

        const uqlStr = 'QUERY tableA.fieldA';

        const unifyQL = new UnifyQL(serviceConfigSource);
        const result = await unifyQL.query(uqlStr);

        expect(result).to.be.deep.equal([{ fieldA: 'fieldA' }]);

        const queryReq = MockFetch.requests[0];

        expect(queryReq.reqUrl).to.be.equal('http://localhost:5000/query');
        expect(queryReq.reqOption.body).to.be.equal('QUERY tableA.fieldA');
    });

    it('should execute query with orderBy and limit', async () => {
        MockFetch.setJsonResult(200, [{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);

        const uqlStr = 'QUERY tableA ORDER BY tableA.fieldA3 DESC LIMIT 0,100';

        const unifyQL = new UnifyQL(serviceConfigSource);
        const result = await unifyQL.query(uqlStr);

        expect(result).to.be.deep.equal([{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);

        const queryReq = MockFetch.requests[0];

        expect(queryReq.reqUrl).to.be.equal('http://localhost:5000/query');
        expect(queryReq.reqOption.body).to.be.equal('QUERY tableA ORDER BY tableA.fieldA3 DESC LIMIT 0, 100');
    });

    it('should execute query with multiple table from same service', async () => {
        MockFetch.setJsonResult(200, [{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);

        const uqlStr = 'QUERY tableA WITH tableB, tableC LINK tableC.fieldC=tableB.fieldB1,tableA.fieldA2=tableB.fieldB2 WHERE (tableC.fieldC1 & 2) != 0';

        const unifyQL = new UnifyQL(serviceConfigSource);
        const result = await unifyQL.query(uqlStr);

        expect(result).to.be.deep.equal([{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);

        const queryReq = MockFetch.requests[0];

        expect(queryReq.reqUrl).to.be.equal('http://localhost:5000/query');
        expect(queryReq.reqOption.body).to.be.equal('QUERY tableA WITH tableC,tableB LINK tableC.fieldC=tableB.fieldB1,tableB.fieldB2=tableA.fieldA2 WHERE (tableC.fieldC1 & 2) != 0');
    });

    it('should execute query with multiple table from different service', async () => {
        MockFetch.setJsonResult(200, [{ fieldD: 1 }, { fieldD: 2 }, { fieldD: 3 }, { fieldD: 4 }]);
        MockFetch.setJsonResult(200, [{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);
        when(mockIdGenerator.nano8()).thenReturn('12345678');

        const uqlStr = 'QUERY tableA WITH tableB, tableC, tableD LINK tableC.fieldC=tableB.fieldB1,tableD.fieldD=tableA.fieldA1,tableA.fieldA2=tableB.fieldB2 WHERE tableD.fieldD1 != 0';

        const unifyQL = new UnifyQL(serviceConfigSource);
        const result = await unifyQL.query(uqlStr);

        expect(result).to.be.deep.equal([{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);

        const queryReq1 = MockFetch.requests[0];
        const queryReq2 = MockFetch.requests[1];

        expect(queryReq1.reqUrl).to.be.equal('http://localhost:4999/query');
        expect(queryReq1.reqOption.body).to.be.equal('QUERY tableD.fieldD WHERE tableD.fieldD1 != 0');

        expect(queryReq2.reqUrl).to.be.equal('http://localhost:5000/query');
        expect(queryReq2.reqOption.body).to.be.equal('QUERY tableA WHERE tableA.fieldA1 IN (1,2,3,4)');
    });

    it('should execute query with recursive dependency', async () => {
        MockFetch.setJsonResult(200, [{ fieldC: 'A' }, { fieldC: 'B' }, { fieldC: 'C' }, { fieldC: 'D' }]);
        MockFetch.setJsonResult(200, [{ fieldD1: 1 }, { fieldD1: 2 }, { fieldD1: 3 }, { fieldD1: 4 }]);
        MockFetch.setJsonResult(200, [{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);
        when(mockIdGenerator.nano8()).thenReturn('12345678').thenReturn('23456789');

        const uqlStr = 'QUERY tableA WITH tableB, tableC, tableD LINK tableC.fieldC=tableD.fieldD2, tableD.fieldD1=tableB.fieldB1, tableA.fieldA2=tableB.fieldB2 WHERE tableC.fieldC1 != 0';

        const unifyQL = new UnifyQL(serviceConfigSource);
        const result = await unifyQL.query(uqlStr);

        expect(result).to.be.deep.equal([{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);

        const queryReq1 = MockFetch.requests[0];
        const queryReq2 = MockFetch.requests[1];
        const queryReq3 = MockFetch.requests[2];

        expect(queryReq1.reqUrl).to.be.equal('http://localhost:5000/query');
        expect(queryReq1.reqOption.body).to.be.equal('QUERY tableC.fieldC WHERE tableC.fieldC1 != 0');

        expect(queryReq2.reqUrl).to.be.equal('http://localhost:4999/query');
        expect(queryReq2.reqOption.body).to.be.equal('QUERY tableD.fieldD1 WHERE tableD.fieldD2 IN ("A","B","C","D")');

        expect(queryReq3.reqUrl).to.be.equal('http://localhost:5000/query');
        expect(queryReq3.reqOption.body).to.be.equal('QUERY tableA WITH tableB LINK tableB.fieldB2=tableA.fieldA2 WHERE tableB.fieldB1 IN (1,2,3,4)');
    });

    it('should execute complex query', async () => {
        MockFetch.setJsonResult(200, [{ fieldD: 1 }, { fieldD: 2 }, { fieldD: 3 }, { fieldD: 4 }]);
        MockFetch.setJsonResult(200, [{ fieldD: 5 }, { fieldD: 6 }, { fieldD: 7 }, { fieldD: 8 }]);
        MockFetch.setJsonResult(200, [{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);
        when(mockIdGenerator.nano8()).thenReturn('12345678').thenReturn('23456789');

        const uqlStr = 'QUERY tableA WITH tableB, tableC, tableD LINK tableC.fieldC=tableB.fieldB1,tableD.fieldD=tableA.fieldA1,tableA.fieldA2=tableB.fieldB2 WHERE tableD.fieldD1 = 0 AND tableC.fieldC1 = 2 AND (tableD.fieldD2 = 1 OR tableB.fieldB = 3) ORDER BY tableA.tableA3 ASC LIMIT 10, 100';

        const unifyQL = new UnifyQL(serviceConfigSource);
        const result = await unifyQL.query(uqlStr);

        expect(result).to.be.deep.equal([{ fieldA: 'fieldA', fieldA1: 'fieldA1', fieldA2: 'fieldA2' }]);

        const queryReq1 = MockFetch.requests[0];
        const queryReq2 = MockFetch.requests[1];
        const queryReq3 = MockFetch.requests[2];

        expect(queryReq1.reqUrl).to.be.equal('http://localhost:4999/query');
        expect(queryReq1.reqOption.body).to.be.equal('QUERY tableD.fieldD WHERE tableD.fieldD1 = 0');

        expect(queryReq2.reqUrl).to.be.equal('http://localhost:4999/query');
        expect(queryReq2.reqOption.body).to.be.equal('QUERY tableD.fieldD WHERE tableD.fieldD2 = 1');

        expect(queryReq3.reqUrl).to.be.equal('http://localhost:5000/query');
        expect(queryReq3.reqOption.body).to.be.equal('QUERY tableA WITH tableC,tableB LINK tableC.fieldC=tableB.fieldB1,tableB.fieldB2=tableA.fieldA2 WHERE ((tableA.fieldA1 IN (1,2,3,4) AND tableC.fieldC1 = 2) AND (tableA.fieldA1 IN (5,6,7,8) OR tableB.fieldB = 3)) ORDER BY tableA.tableA3 ASC LIMIT 10, 100');
    });

    it('should avoid SQL injection - Authorization Bypass', async () => {

        const uqlStr = 'QUERY tableA WITH tableB LINK tableA.fieldA2=tableB.fieldB2 WHERE tableB.fieldB = "valueB" OR 1=1--"';

        const unifyQL = new UnifyQL(serviceConfigSource);
        try {
            await unifyQL.query(uqlStr);
            expect.fail();
        } catch (e: any) {
            expect(e.message).to.be.equal('Bad state: empty tree');
        }
    });

    it('should avoid SQL injection - Malicious Commands', async () => {

        const uqlStr = 'QUERY tableA WITH tableB LINK tableA.fieldA2=tableB.fieldB2 WHERE tableB.fieldB = "valueB"; DROP TABLE tableA--"';

        const unifyQL = new UnifyQL(serviceConfigSource);
        try {
            await unifyQL.query(uqlStr);
            expect.fail();
        } catch (e: any) {
            expect(e.message).to.be.equal('Bad state: empty tree');
        }
    });

    afterEach(() => {
        MockFetch.clearResult();
        reset(mockIdGenerator);
    });
});
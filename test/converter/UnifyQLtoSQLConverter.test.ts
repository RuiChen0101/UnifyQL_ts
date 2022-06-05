import 'mocha';
import { expect } from 'chai';

import UnifyQLtoSQLConverter from "../../src/converter/UnifyQLtoSQLConverter";

describe('UnifyQLtoSQLConverter', () => {
    it('should convert UnifyQL to SQL', () => {
        const uql = 'QUERY tableA';
        const converter = new UnifyQLtoSQLConverter();
        const sql = converter.convert(uql);
        expect(sql).to.be.equal('SELECT tableA.* FROM tableA');
    });

    it('should convert Count UnifyQL to SQL', () => {
        const uql = 'COUNT tableA';
        const converter = new UnifyQLtoSQLConverter();
        const sql = converter.convert(uql);
        expect(sql).to.be.equal('SELECT count(tableA.*) count FROM tableA');
    });

    it('should convert Sum UnifyQL to SQL', () => {
        const uql = 'SUM tableA.fieldA1';
        const converter = new UnifyQLtoSQLConverter();
        const sql = converter.convert(uql);
        expect(sql).to.be.equal('SELECT sum(tableA.fieldA1) sum FROM tableA');
    });

    it('should convert UnifyQL to SQL with where orderBy and limit', () => {
        const uql = 'QUERY tableA WHERE tableA.fieldA=1 ORDER BY tableA.fieldA1 ASC LIMIT 0,100';
        const converter = new UnifyQLtoSQLConverter();
        const sql = converter.convert(uql);
        expect(sql).to.be.equal('SELECT tableA.* FROM tableA WHERE tableA.fieldA=1 ORDER BY tableA.fieldA1 ASC LIMIT 0, 100');
    });

    it('should convert UnifyQL to SQL with with and link', () => {
        const uql = 'QUERY tableA WITH tableB, tableC LINK tableC.fieldC=tableB.fieldB1,tableA.fieldA2=tableB.fieldB2 WHERE (tableC.fieldC1 & 2) != 0';
        const converter = new UnifyQLtoSQLConverter();
        const sql = converter.convert(uql);
        expect(sql).to.be.equal('SELECT tableA.* FROM tableB,tableC,tableA WHERE tableC.fieldC=tableB.fieldB1 AND tableA.fieldA2=tableB.fieldB2 AND (tableC.fieldC1 & 2) != 0');
    });

    it('should convert UnifyQL to SQL with specify field', () => {
        const uql = 'QUERY tableA.fieldA2 WHERE tableA.fieldA=1 ORDER BY tableA.fieldA1 ASC LIMIT 0,100';
        const converter = new UnifyQLtoSQLConverter();
        const sql = converter.convert(uql);
        expect(sql).to.be.equal('SELECT tableA.fieldA2 fieldA2 FROM tableA WHERE tableA.fieldA=1 ORDER BY tableA.fieldA1 ASC LIMIT 0, 100');
    });
});
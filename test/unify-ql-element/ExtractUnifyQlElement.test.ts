import 'mocha';
import { expect } from 'chai';

import extractQLElement from '../../src/unify-ql-element/ExtractUnifyQlElement';


describe('ExtractUnifyQlElement', () => {
    it('should extract query with query operation', async () => {

        const uqlStr = 'QUERY tableA WITH tableB, tableC, tableD LINK tableC.fieldC=tableB.fieldB1,tableD.fieldD=tableA.fieldA1,tableA.fieldA2=tableB.fieldB2 WHERE tableD.fieldD1 = 0 AND tableC.fieldC1 = 2 AND (tableD.fieldD2 = 1 OR tableB.fieldB = 3) ORDER BY tableA.tableA3 ASC LIMIT 10, 100';

        const element = extractQLElement(uqlStr);
        expect(element).to.be.deep.equal(
            {
                "limit": [
                    10,
                    100
                ],
                "link": [
                    "tableC.fieldC=tableB.fieldB1",
                    "tableD.fieldD=tableA.fieldA1",
                    "tableA.fieldA2=tableB.fieldB2"
                ],
                "operation": 0,
                "orderBy": [
                    "tableA.tableA3 ASC"
                ],
                "queryTarget": "tableA",
                "where": "tableD.fieldD1 = 0 AND tableC.fieldC1 = 2 AND (tableD.fieldD2 = 1 OR tableB.fieldB = 3)",
                "with": [
                    "tableB",
                    "tableC",
                    "tableD"
                ]
            }
        );
    });

    it('should extract query with sum operation', async () => {

        const uqlStr = 'SUM tableA.fieldA4 WITH tableB, tableC, tableD LINK tableC.fieldC=tableB.fieldB1,tableD.fieldD=tableA.fieldA1,tableA.fieldA2=tableB.fieldB2 WHERE tableD.fieldD1 = 0 AND tableC.fieldC1 = 2 AND (tableD.fieldD2 = 1 OR tableB.fieldB = 3) ORDER BY tableA.tableA3 ASC LIMIT 10, 100';

        const element = extractQLElement(uqlStr);
        expect(element).to.be.deep.equal(
            {
                "limit": [
                    10,
                    100
                ],
                "link": [
                    "tableC.fieldC=tableB.fieldB1",
                    "tableD.fieldD=tableA.fieldA1",
                    "tableA.fieldA2=tableB.fieldB2"
                ],
                "operation": 2,
                "orderBy": [
                    "tableA.tableA3 ASC"
                ],
                "queryTarget": "tableA",
                "queryField": "fieldA4",
                "where": "tableD.fieldD1 = 0 AND tableC.fieldC1 = 2 AND (tableD.fieldD2 = 1 OR tableB.fieldB = 3)",
                "with": [
                    "tableB",
                    "tableC",
                    "tableD"
                ]
            }
        );
    });

    it('should extract query with count operation', async () => {

        const uqlStr = 'COUNT tableA WITH tableB, tableC, tableD LINK tableC.fieldC=tableB.fieldB1,tableD.fieldD=tableA.fieldA1,tableA.fieldA2=tableB.fieldB2 WHERE tableD.fieldD1 = 0 AND tableC.fieldC1 = 2 AND (tableD.fieldD2 = 1 OR tableB.fieldB = 3) ORDER BY tableA.tableA3 ASC LIMIT 10, 100';

        const element = extractQLElement(uqlStr);
        expect(element).to.be.deep.equal(
            {
                "limit": [
                    10,
                    100
                ],
                "link": [
                    "tableC.fieldC=tableB.fieldB1",
                    "tableD.fieldD=tableA.fieldA1",
                    "tableA.fieldA2=tableB.fieldB2"
                ],
                "operation": 1,
                "orderBy": [
                    "tableA.tableA3 ASC"
                ],
                "queryTarget": "tableA",
                "where": "tableD.fieldD1 = 0 AND tableC.fieldC1 = 2 AND (tableD.fieldD2 = 1 OR tableB.fieldB = 3)",
                "with": [
                    "tableB",
                    "tableC",
                    "tableD"
                ]
            }
        );
    });
});
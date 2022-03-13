import 'mocha';
import { expect } from 'chai';
import QueryChainBuilder from '../../src/query-chain/QueryChainBuilder';
import IQueryChainRelation from '../../src/query-chain/IQueryChainRelation';

describe('QueryChainBuilder', () => {
    it('should build query chain', () => {
        const builder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );

        const queryChain = builder.build();

        const forwardRelationMap = queryChain.forwardRelationMap;
        expect(forwardRelationMap['tableA']['tableB']).to.be.deep.equal({
            fromField: 'fieldA2',
            fromTable: 'tableA',
            toField: 'fieldB2',
            toTable: 'tableB'
        });
        expect(forwardRelationMap['tableA']['tableD']).to.be.deep.equal({
            fromField: 'fieldA1',
            fromTable: 'tableA',
            toField: 'fieldD',
            toTable: 'tableD'
        });
        expect(forwardRelationMap['tableB']['tableC']).to.be.deep.equal({
            fromField: 'fieldB1',
            fromTable: 'tableB',
            toField: 'fieldC',
            toTable: 'tableC'
        });

        const backwardRelationMap = queryChain.backwardRelationMap;
        expect(backwardRelationMap['tableD']['tableA']).to.be.deep.equal({
            fromField: 'fieldD',
            fromTable: 'tableD',
            toField: 'fieldA1',
            toTable: 'tableA'
        });
        expect(backwardRelationMap['tableC']['tableB']).to.be.deep.equal({
            fromField: 'fieldC',
            fromTable: 'tableC',
            toField: 'fieldB1',
            toTable: 'tableB'
        });
        expect(backwardRelationMap['tableB']['tableA']).to.be.deep.equal({
            fromField: 'fieldB2',
            fromTable: 'tableB',
            toField: 'fieldA2',
            toTable: 'tableA'
        });
    });

    it('should throw exception if using undefined table', () => {
        expect(function () {
            const builder: QueryChainBuilder = new QueryChainBuilder(
                'tableA',
                ['tableB', 'tableC'],
                ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
            );
        }).to.throw('tableD.fieldD=tableA.fieldA1 using undefined table');
    });
});
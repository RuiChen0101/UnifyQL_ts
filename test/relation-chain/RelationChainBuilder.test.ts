import 'mocha';
import { expect } from 'chai';
import IUnifyQLElement from '../../src/unify-ql-element/IUnifyQLElement';
import EUnifyQLOperation from '../../src/unify-ql-element/EUnifyQLOperation';
import RelationChainBuilder from '../../src/relation-chain/RelationChainBuilder';

describe('RelationChainBuilder', () => {
    it('should build query chain', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: ['tableB', 'tableC', 'tableD'],
            link: ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2'],
            where: '',
        }
        const builder: RelationChainBuilder = new RelationChainBuilder(element);

        const relationChain = builder.build();

        const forwardRelationMap = relationChain.forwardRelationMap;
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

        const backwardRelationMap = relationChain.backwardRelationMap;
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

    it('should build query chain without with and link', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: [],
            link: [],
            where: '',
        }
        const builder: RelationChainBuilder = new RelationChainBuilder(element);

        const relationChain = builder.build();

        const forwardRelationMap = relationChain.forwardRelationMap;
        expect(forwardRelationMap).to.be.deep.equal({});

        const backwardRelationMap = relationChain.backwardRelationMap;
        expect(backwardRelationMap).to.be.deep.equal({});
    });

    it('should throw exception if using undefined table', () => {
        const element: IUnifyQLElement = {
            operation: EUnifyQLOperation.Query,
            queryTarget: 'tableA',
            with: ['tableB', 'tableC'],
            link: ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2'],
            where: '',
        }
        expect(function () {
            new RelationChainBuilder(element);
        }).to.throw('RelationChain: tableD.fieldD=tableA.fieldA1 using undefined table');
    });
});
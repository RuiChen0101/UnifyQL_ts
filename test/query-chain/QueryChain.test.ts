import 'mocha';
import { expect } from 'chai';
import QueryChainBuilder from "../../src/query-chain/QueryChainBuilder";

describe('QueryChain', () => {
    it('should get direct descendant by table', () => {
        const builder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );

        const queryChain = builder.build();

        expect(queryChain.getDirectDescendant('tableA')).to.be.deep.equal([{
            "fromField": "fieldA1",
            "fromTable": "tableA",
            "toField": "fieldD",
            "toTable": "tableD"
        }, {
            "fromField": "fieldA2",
            "fromTable": "tableA",
            "toField": "fieldB2",
            "toTable": "tableB"
        }]);
        expect(queryChain.getDirectDescendant('tableB')).to.be.deep.equal([{
            "fromField": "fieldB1",
            "fromTable": "tableB",
            "toField": "fieldC",
            "toTable": "tableC"
        }]);
        expect(queryChain.getDirectDescendant('tableD')).to.be.deep.equal([]);
    });

    it('should get direct parent by table', () => {
        const builder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );

        const queryChain = builder.build();

        expect(queryChain.getDirectParent('tableA')).to.be.deep.equal([]);
        expect(queryChain.getDirectParent('tableB')).to.be.deep.equal([{
            "fromField": "fieldB2",
            "fromTable": "tableB",
            "toField": "fieldA2",
            "toTable": "tableA"
        }]);
        expect(queryChain.getDirectParent('tableD')).to.be.deep.equal([{
            "fromField": "fieldD",
            "fromTable": "tableD",
            "toField": "fieldA1",
            "toTable": "tableA"
        }]);
    });

    it('should check is table1 parent of table2', () => {
        const builder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );

        const queryChain = builder.build();

        expect(queryChain.isParentOf('tableA', 'tableC')).to.be.true;
        expect(queryChain.isParentOf('tableA', 'tableD')).to.be.true;
        expect(queryChain.isParentOf('tableB', 'tableC')).to.be.true;
        expect(queryChain.isParentOf('tableC', 'tableC')).to.be.false;
        expect(queryChain.isParentOf('tableC', 'tableA')).to.be.false;
        expect(queryChain.isParentOf('tableC', 'tableD')).to.be.false;
    });

    it('should check is table1 descendant of table2', () => {
        const builder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );

        const queryChain = builder.build();

        expect(queryChain.isDescendantOf('tableC', 'tableA')).to.be.true;
        expect(queryChain.isDescendantOf('tableC', 'tableB')).to.be.true;
        expect(queryChain.isDescendantOf('tableD', 'tableA')).to.be.true;
        expect(queryChain.isDescendantOf('tableC', 'tableC')).to.be.false;
        expect(queryChain.isDescendantOf('tableB', 'tableC')).to.be.false;
        expect(queryChain.isDescendantOf('tableC', 'tableD')).to.be.false;
    });

    it('should find lowest common parent of two table', () => {
        const builder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );

        const queryChain = builder.build();

        expect(queryChain.findLowestCommonParent('tableC', 'tableA')).to.be.equal('tableA');
        expect(queryChain.findLowestCommonParent('tableC', 'tableB')).to.be.equal('tableB');
        expect(queryChain.findLowestCommonParent('tableC', 'tableD')).to.be.equal('tableA');
    });

    it('should find relation path between two table', () => {
        const builder: QueryChainBuilder = new QueryChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );

        const queryChain = builder.build();

        expect(queryChain.findRelationPath('tableC', 'tableA')).to.be.deep.equal([{
            "fromField": "fieldC",
            "fromTable": "tableC",
            "toField": "fieldB1",
            "toTable": "tableB"
        }, {
            "fromField": "fieldB2",
            "fromTable": "tableB",
            "toField": "fieldA2",
            "toTable": "tableA"
        }]);

        expect(queryChain.findRelationPath('tableA', 'tableD')).to.be.deep.equal([{
            "fromField": "fieldD",
            "fromTable": "tableD",
            "toField": "fieldA1",
            "toTable": "tableA"
        }]);

        expect(queryChain.findRelationPath('tableB', 'tableD')).not.exist;
    });
});
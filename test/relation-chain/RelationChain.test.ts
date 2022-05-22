import 'mocha';
import { expect } from 'chai';
import RelationChainBuilder from "../../src/relation-chain/RelationChainBuilder";

describe('RelationChain', () => {
    it('should get direct descendant by table', () => {
        const builder: RelationChainBuilder = new RelationChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );

        const relationChain = builder.build();

        expect(relationChain.getDirectDescendant('tableA')).to.be.deep.equal([{
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
        expect(relationChain.getDirectDescendant('tableB')).to.be.deep.equal([{
            "fromField": "fieldB1",
            "fromTable": "tableB",
            "toField": "fieldC",
            "toTable": "tableC"
        }]);
        expect(relationChain.getDirectDescendant('tableD')).to.be.deep.equal([]);
    });

    it('should get direct parent by table', () => {
        const builder: RelationChainBuilder = new RelationChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );

        const relationChain = builder.build();

        expect(relationChain.getDirectParent('tableA')).to.be.deep.equal([]);
        expect(relationChain.getDirectParent('tableB')).to.be.deep.equal([{
            "fromField": "fieldB2",
            "fromTable": "tableB",
            "toField": "fieldA2",
            "toTable": "tableA"
        }]);
        expect(relationChain.getDirectParent('tableD')).to.be.deep.equal([{
            "fromField": "fieldD",
            "fromTable": "tableD",
            "toField": "fieldA1",
            "toTable": "tableA"
        }]);
    });

    it('should check is table1 parent of table2', () => {
        const builder: RelationChainBuilder = new RelationChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );

        const relationChain = builder.build();

        expect(relationChain.isParentOf('tableA', 'tableC')).to.be.true;
        expect(relationChain.isParentOf('tableA', 'tableD')).to.be.true;
        expect(relationChain.isParentOf('tableB', 'tableC')).to.be.true;
        expect(relationChain.isParentOf('tableC', 'tableC')).to.be.false;
        expect(relationChain.isParentOf('tableC', 'tableA')).to.be.false;
        expect(relationChain.isParentOf('tableC', 'tableD')).to.be.false;
    });

    it('should check is table1 descendant of table2', () => {
        const builder: RelationChainBuilder = new RelationChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );

        const relationChain = builder.build();

        expect(relationChain.isDescendantOf('tableC', 'tableA')).to.be.true;
        expect(relationChain.isDescendantOf('tableC', 'tableB')).to.be.true;
        expect(relationChain.isDescendantOf('tableD', 'tableA')).to.be.true;
        expect(relationChain.isDescendantOf('tableC', 'tableC')).to.be.false;
        expect(relationChain.isDescendantOf('tableB', 'tableC')).to.be.false;
        expect(relationChain.isDescendantOf('tableC', 'tableD')).to.be.false;
    });

    it('should find lowest common parent of two table', () => {
        const builder: RelationChainBuilder = new RelationChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );

        const relationChain = builder.build();

        expect(relationChain.findLowestCommonParent('tableC', 'tableA')).to.be.equal('tableA');
        expect(relationChain.findLowestCommonParent('tableC', 'tableB')).to.be.equal('tableB');
        expect(relationChain.findLowestCommonParent('tableC', 'tableD')).to.be.equal('tableA');
    });

    it('should find relation path between two table', () => {
        const builder: RelationChainBuilder = new RelationChainBuilder(
            'tableA',
            ['tableB', 'tableC', 'tableD'],
            ['tableC.fieldC=tableB.fieldB1', 'tableD.fieldD=tableA.fieldA1', 'tableA.fieldA2=tableB.fieldB2']
        );

        const relationChain = builder.build();

        expect(relationChain.findRelationPath('tableC', 'tableA')).to.be.deep.equal([{
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

        expect(relationChain.findRelationPath('tableA', 'tableD')).to.be.deep.equal([{
            "fromField": "fieldD",
            "fromTable": "tableD",
            "toField": "fieldA1",
            "toTable": "tableA"
        }]);

        expect(relationChain.findRelationPath('tableB', 'tableD')).not.exist;
    });
});
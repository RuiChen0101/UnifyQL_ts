import 'mocha';
import { expect } from 'chai';
import ConditionNode from '../../src/expression-tree/ConditionNode';

describe('ConditionNode', () => {
    it('should extract info without modifier when initialize', () => {
        const condition: string = 'tableA.fieldA IN ("0912","0934")';
        const conditionNode: ConditionNode = new ConditionNode(condition);
        expect(conditionNode.table).to.be.equal('tableA');
        expect(conditionNode.field).to.be.equal('fieldA');
        expect(conditionNode.modifier).to.be.undefined;
        expect(conditionNode.modifyValue).to.be.undefined;
        expect(conditionNode.conditionOp).to.be.equal('IN');
        expect(conditionNode.conditionValue).to.be.equal('("0912","0934")');
    });

    it('should extract info with modifier when initialize', () => {
        const condition: string = '(tableB.fieldB & 2) != 0';
        const conditionNode: ConditionNode = new ConditionNode(condition);
        expect(conditionNode.table).to.be.equal('tableB');
        expect(conditionNode.field).to.be.equal('fieldB');
        expect(conditionNode.modifier).to.be.equal('&');
        expect(conditionNode.modifyValue).to.be.equal('2');
        expect(conditionNode.conditionOp).to.be.equal('!=');
        expect(conditionNode.conditionValue).to.be.equal('0');
    });

    it('should check weather or not the string is valid condition', () => {
        expect(ConditionNode.isValidCondition('tableA.fieldA IN ("0912","0934")')).to.be.true;
        expect(ConditionNode.isValidCondition('tableA.fieldA IN ')).to.be.false;
        expect(ConditionNode.isValidCondition('tableB.fieldB & 2')).to.be.false;
        expect(ConditionNode.isValidCondition('"0912","0934"')).to.be.false;
    });
});
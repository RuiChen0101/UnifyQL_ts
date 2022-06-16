import 'mocha';
import { expect } from 'chai';
import ConditionNode from '../../src/expression-tree/ConditionNode';

describe('ConditionNode', () => {
    it('should extract info', () => {
        const condition: string = 'tableA.fieldA = "1234 5678"';
        const conditionNode: ConditionNode = new ConditionNode(condition);
        expect(conditionNode.table).to.be.equal('tableA');
    });

    it('should extract info without modifier when initialize', () => {
        const condition: string = 'tableA.fieldA IN ("0912","0934")';
        const conditionNode: ConditionNode = new ConditionNode(condition);
        expect(conditionNode.table).to.be.equal('tableA');
    });

    it('should extract info with modifier when initialize', () => {
        const condition: string = '(tableB.fieldB & 2) != 0';
        const conditionNode: ConditionNode = new ConditionNode(condition);
        expect(conditionNode.table).to.be.equal('tableB');
        expect(conditionNode.conditionStr).to.be.equal('(tableB.fieldB & 2) != 0');
    });
});
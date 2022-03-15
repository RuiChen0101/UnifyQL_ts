import 'mocha';
import { expect } from 'chai';
import BinaryOperatorNode from '../../src/expression-tree/BinaryOperatorNode';

describe('BinaryOperatorNode', () => {
    it('should take op type when initialize', () => {
        const node: BinaryOperatorNode = new BinaryOperatorNode('AND');
        expect(node.opType).to.be.equal('AND');
    });
});
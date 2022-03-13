import 'mocha';
import { expect } from 'chai';
import ServiceLookup from '../../src/lookup/ServiceLookup';

const serviceLookup: ServiceLookup = new ServiceLookup();

describe('ServiceLookup', () => {
    it('should get serviceName by table', () => {
        expect(serviceLookup.getServiceNameByTable('payment')).to.be.equal('paymentService');
        expect(serviceLookup.getServiceNameByTable('user')).to.be.equal('userService');
        expect(serviceLookup.getServiceNameByTable('merch_item')).to.be.equal('merchService');
        expect(serviceLookup.getServiceNameByTable('logistic')).to.be.equal('logisticService');
    });

    it('should get serviceConfig by serviceName', () => {
        expect(serviceLookup.getServiceConfig('paymentService').serviceName).to.be.equal('paymentService');
        expect(serviceLookup.getServiceConfig('userService').serviceName).to.be.equal('userService');
        expect(serviceLookup.getServiceConfig('merchService').serviceName).to.be.equal('merchService');
        expect(serviceLookup.getServiceConfig('logisticService').serviceName).to.be.equal('logisticService');
    });

    it('should return true if given tables is from same service', () => {
        expect(serviceLookup.isAllFromSameService(['logistic', 'shipping_timeline'])).to.be.true;
        expect(serviceLookup.isAllFromSameService(['merch_item', 'merch_order'])).to.be.true;
        expect(serviceLookup.isAllFromSameService(['user'])).to.be.true;
    });

    it('should return false if given tables is not from same service', () => {
        expect(serviceLookup.isAllFromSameService([])).to.be.false;
        expect(serviceLookup.isAllFromSameService(['logistic', 'user'])).to.be.false;
        expect(serviceLookup.isAllFromSameService(['payment', 'merch_order'])).to.be.false;
    });
});
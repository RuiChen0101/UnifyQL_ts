import 'mocha';
import { expect } from 'chai';
import ServiceLookup from '../../src/lookup/ServiceLookup';

const serviceLookup: ServiceLookup = new ServiceLookup();

describe('ServiceLookup', () => {
    it('should get serviceName by table', () => {
        expect(serviceLookup.getServiceNameByTable('tableA')).to.be.equal('aService');
        expect(serviceLookup.getServiceNameByTable('tableD')).to.be.equal('bService');
    });

    it('should get serviceConfig by serviceName', () => {
        expect(serviceLookup.getServiceConfig('aService').serviceName).to.be.equal('aService');
        expect(serviceLookup.getServiceConfig('bService').serviceName).to.be.equal('bService');
    });

    it('should return true if given tables is from same service', () => {
        expect(serviceLookup.isAllFromSameService(['tableA', 'tableB', 'tableC'])).to.be.true;
        expect(serviceLookup.isAllFromSameService(['tableD', 'tableE', 'tableF'])).to.be.true;
        expect(serviceLookup.isAllFromSameService(['tableA'])).to.be.true;
    });

    it('should return false if given tables is not from same service', () => {
        expect(serviceLookup.isAllFromSameService([])).to.be.false;
        expect(serviceLookup.isAllFromSameService(['tableA', 'tableD'])).to.be.false;
        expect(serviceLookup.isAllFromSameService(['tableB', 'tableE'])).to.be.false;
    });
});
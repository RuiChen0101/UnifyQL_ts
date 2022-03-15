import 'mocha';
import { expect } from 'chai';

describe('Check test setup', () => {
    it('should pass', () => {
        expect(true).to.be.true;
    });

    // it('test', () => {
    //     const rx: RegExp = /\s*(AND|OR|\(|\))\s*/gm;
    //     const str: string = "user.phone=\"0912345678\" OR ((user.phone + \"09\") = \"0923456789\" AND merch_order.merch_item_id=\"ylAlUwE1MnhJZty7\")";
    //     console.log(str.split(rx));
    // });
});
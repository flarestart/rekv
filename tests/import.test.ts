import { expect } from 'chai';
import Rekv, { Rekv as R } from '../src/rekv';

describe('rekv', () => {
  it('expect import default as same as Rekv', () => {
    expect(Rekv).to.equal(R);
  });
});

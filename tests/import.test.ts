import { expect } from 'chai';
import Rekv, { Rekv as R, globalStore } from '../src/rekv';

describe('rekv', () => {
  it('expect import default as same as Rekv', () => {
    expect(Rekv).to.equal(R);
  });

  it('export globalStore', () => {
    expect(globalStore).instanceOf(Rekv);
  });
});

import { expect } from 'chai';
import { Rekv } from '../src/';

describe('rekv', () => {
  it('new Rekv()', () => {
    const rekv = new Rekv(
      {
        test: 'test',
        foo: 'bar',
      },
      {
        effects: {
          changeFoo() {
            this.setState({
              foo: this.currentState.foo + '+',
            });
          },
        },
      }
    );
    rekv.effects.changeFoo();
    expect(rekv.currentState).to.contains({ foo: 'bar+', test: 'test' });
  });
});

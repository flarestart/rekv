import { expect } from 'chai';
import Rekv from '../src/rekv';

describe('rekv', () => {
  it('delegate beforeUpdate', () => {
    const rekv = new Rekv({ a: 0 });

    let v1;
    let v2;
    Rekv.delegate.beforeUpdate = ({ state }) => {
      v1 = state;
    };

    rekv.delegate.beforeUpdate = ({ state }) => {
      v2 = state;
    };
    rekv.setState({ a: 1 });

    Rekv.delegate.beforeUpdate = undefined;
    expect(v1).to.contain({ a: 1 });
    expect(v2).to.contain({ a: 1 });
  });

  it('delegate beforeUpdate return value', () => {
    const rekv = new Rekv({});

    let v1;
    let v2;
    Rekv.delegate.beforeUpdate = ({ state }) => {
      v1 = state;
      return v1;
    };

    rekv.delegate.beforeUpdate = ({ state }) => {
      v2 = state;
      return v2;
    };
    rekv.setState({ a: 1 });

    Rekv.delegate.beforeUpdate = undefined;
    expect(v1).to.contain({ a: 1 });
    expect(v2).to.contain({ a: 1 });
  });

  it('delegate afterUpdate', () => {
    const rekv = new Rekv({});

    let v1;
    let v2;
    Rekv.delegate.afterUpdate = ({ state }) => {
      v1 = state;
    };

    rekv.delegate.afterUpdate = ({ state }) => {
      v2 = state;
    };
    rekv.setState({ a: 1 });
    Rekv.delegate.afterUpdate = undefined;
    expect(v1).to.contain({ a: 1 });
    expect(v2).to.contain({ a: 1 });
  });

  it('delegate beforeUpdate setState', () => {
    const rekv = new Rekv({});

    let v1;
    Rekv.delegate.beforeUpdate = ({ state, store }) => {
      v1 = state;
      store.setState(v1);
    };

    rekv.setState({ a: 1 });

    expect(v1).to.contain({ a: 1 });
  });
});

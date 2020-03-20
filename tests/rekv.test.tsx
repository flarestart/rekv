import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import { act } from 'react-dom/test-utils';
import { Rekv } from '../src/rekv';

/**
 * sleep
 * @param ms ms
 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('rekv', () => {
  it('new Rekv()', () => {
    const rekv = new Rekv({
      test: 'test',
      foo: 'bar',
    });
    expect(rekv.getCurrentState()).to.contains({ foo: 'bar', test: 'test' });
  });
  it('new Rekv(undefined) will throw error', () => {
    expect(() => {
      new Rekv(undefined);
    }).to.throw();
  });
  it('new Rekv(null) will throw error', () => {
    expect(() => {
      new Rekv(null);
    }).to.throw();
  });
  it('.setState()', () => {
    const rekv = new Rekv({
      test: 'test',
    });
    rekv.setState({
      test: 'demo',
    });
    expect(rekv.getCurrentState()).to.contains({ test: 'demo' });
  });
  it('.setState() throw error', () => {
    const rekv = new Rekv({
      initState: {
        test: 'test',
      },
    });
    expect(() => {
      rekv.setState(null);
    }).to.throw();
  });
  it('.setState(() => {})', () => {
    const rekv = new Rekv({
      count: 0,
    });
    for (let n = 0; n < 10; n++) {
      rekv.setState((state) => {
        return {
          count: state.count + 1,
        };
      });
    }
    expect(rekv.getCurrentState().count).to.equal(10);
  });
  it('.useState()', async () => {
    await act(async () => {
      const rekv = new Rekv({
        demo: 'demo',
      });
      function Test() {
        const { demo } = rekv.useState('demo');
        return <div>{demo}</div>;
      }
      const wrapper = mount(<Test />);
      await sleep(100);
      expect(wrapper.find('div').text()).to.equal('demo');
      rekv.setState({
        demo: 'test',
      });
      await sleep(100);
      expect(wrapper.find('div').text()).to.equal('test');
    });
  });
  it('.classUseState()', async () => {
    const rekv = new Rekv({
      count: 0,
      test: 'test',
      foo: 'bar',
    });

    class Test extends React.Component {
      s = rekv.classUseState(this, 'count', 'test');

      render() {
        return (
          <div>
            {this.s.count},{this.s.test}
          </div>
        );
      }
    }
    const wrapper = mount(<Test />);
    await sleep(100);
    rekv.setState({
      count: 1,
      test: 'test',
    });
    rekv.setState({
      foo: 'bar',
    });
    await sleep(100);
    expect(wrapper.find('div').text()).to.equal('1,test');
  });

  it('unmount hook component', async () => {
    const rekv = new Rekv({
      visible: true,
      test: 'test',
    });
    function Box() {
      const { visible } = rekv.useState('visible');
      return <div>{visible && <Test />}</div>;
    }
    function Test() {
      const { test } = rekv.useState('test');
      return <div>{test}</div>;
    }

    const wrapper = mount(<Box />);
    await sleep(100);
    act(() => {
      rekv.setState({
        visible: false,
      });
    });
    await sleep(100);
    expect(wrapper.html()).to.equal('<div></div>');
  });

  it('unmount class component', async () => {
    const rekv = new Rekv({
      visible: true,
      test: 'test',
    });
    function Box() {
      const { visible } = rekv.useState('visible');
      return <div>{visible && <Test />}</div>;
    }
    class Test extends React.Component {
      s = rekv.classUseState(this, 'test');

      componentWillUnmount() {
        // do nothing
      }

      render() {
        return <div>{this.s.test}</div>;
      }
    }

    const wrapper = mount(<Box />);
    await sleep(100);
    act(() => {
      rekv.setState({
        visible: false,
      });
    });
    await sleep(100);
    expect(wrapper.html()).to.equal('<div></div>');
  });
  it('multi component', async () => {
    const rekv = new Rekv({
      test: 'test',
    });
    function Test1() {
      const { test } = rekv.useState('test');
      return <div>{test}</div>;
    }
    function Test2() {
      const { test } = rekv.useState('test');
      return <div>{test}</div>;
    }
    const wrapper = mount(
      <div>
        <Test1 />
        <Test2 />
      </div>
    );
    await sleep(100);
    act(() => {
      rekv.setState({
        test: 'demo',
      });
    });
    await sleep(100);
    expect(wrapper.html()).to.equal('<div><div>demo</div><div>demo</div></div>');
  });
});

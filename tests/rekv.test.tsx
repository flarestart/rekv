import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import { act } from 'react-dom/test-utils';
import { Rekv, rekv } from '../src/rekv';

/**
 * sleep
 * @param ms ms
 */
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('rekv', () => {
  it('rekv instance of Rekv', ()=> {
    expect(rekv).to.instanceOf(Rekv)
  })
  it('new Rekv()', () => {
    const rekv = new Rekv({
      initState: {
        test: 'test',
        foo: 'bar',
      },
    });
    expect(rekv.getCurrentState()).to.contains({ foo: 'bar', test: 'test' });
  });
  it('new Rekv() throw error', () => {
    expect(() => {
      const rekv = new Rekv({
        initState: null,
      });
    }).to.throw();
  });
  it('.setState()', () => {
    const rekv = new Rekv({
      initState: {
        test: 'test',
      },
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
      initState: {
        count: 0,
      },
    });
    for (let n = 0; n < 10; n++) {
      rekv.setState(state => {
        return {
          count: state.count + 1,
        };
      });
    }
    expect(rekv.getCurrentState().count).to.equal(10);
  });
  it('.setInitState()', () => {
    const rekv = new Rekv<any>({
      initState: {
        count: 0,
      },
    });
    rekv.setInitState({
      count: 1,
      demo: 'test',
    });
    expect(rekv.getCurrentState()).to.contains({
      count: 0,
      demo: 'test',
    });
  });
  it('.setInitState() throw error', () => {
    const rekv = new Rekv();
    expect(() => {
      rekv.setInitState(null);
    }).to.throw();
  });
  it('.useState()', async () => {
    await act(async () => {
      const rekv = new Rekv({
        initState: {
          demo: 'demo',
        },
      });
      function Test() {
        const state = rekv.useState('demo');
        return <div>{state}</div>;
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
  it('.bindClassComponent()', async () => {
    const rekv = new Rekv({
      initState: {
        count: 0,
        test: 'test',
        foo: 'bar',
      },
    });
    class Test extends React.Component {
      state = {
        count: 0,
        test: '',
      };
      componentDidMount() {
        rekv.bindClassComponent(this, {});
        rekv.bindClassComponent(this, { count: true, test: 'test' });
        rekv.bindClassComponent(this, { count: true, test: 'test' });
      }
      componentWillUnmount() {
        rekv.unbindClassComponent(this);
      }

      render() {
        return (
          <div>
            {this.state.count},{this.state.test}
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
      initState: {
        visible: true,
        test: 'test',
      },
    });
    function Box() {
      const visible = rekv.useState('visible');
      return <div>{visible && <Test />}</div>;
    }
    function Test() {
      const test = rekv.useState('test');
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
      initState: {
        visible: true,
        test: 'test',
      },
    });
    function Box() {
      const visible = rekv.useState('visible');
      return <div>{visible && <Test />}</div>;
    }
    class Test extends React.Component {
      state = {
        test: '',
      };
      componentDidMount() {
        rekv.bindClassComponent(this, { test: true });
      }
      componentWillUnmount() {
        rekv.unbindClassComponent(this);
      }

      render() {
        return <div>{this.state.test}</div>;
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
      initState: {
        test: 'test',
      },
    });
    function Test1() {
      const test = rekv.useState('test');
      return <div>{test}</div>;
    }
    function Test2() {
      const test = rekv.useState('test');
      return <div>{test}</div>;
    }
    const wrapper = mount(<div><Test1 /><Test2 /></div>)
    await sleep(100);
    act(() => {
      rekv.setState({
        test: 'demo',
      })
    })
    await sleep(100);
    expect(wrapper.html()).to.equal('<div><div>demo</div><div>demo</div></div>')
  })
});

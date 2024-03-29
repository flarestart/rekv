# Rekv

Rekv 是一个为 React 函数式组件设计的全局状态管理器，且对类组件具有很好的兼容，所有方法与状态均有 TypeScript 提示

[English Document](./README_EN.md)

[![Test coverage][codecov-image]][codecov-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][downloads-url]

[codecov-image]: https://img.shields.io/codecov/c/github/flarestart/rekv.svg?style=flat-square
[codecov-url]: https://codecov.io/github/flarestart/rekv?branch=master
[npm-image]: https://img.shields.io/npm/v/rekv.svg
[npm-url]: https://npmjs.org/package/rekv
[downloads-image]: http://img.shields.io/npm/dm/rekv.svg
[downloads-url]: https://npmjs.org/package/rekv

### 特色<a id="feature"></a>

- 一个简单但易用的状态管理器
- 无 Redux，无依赖，gzip 后仅有 1.5 KB
- 不使用高阶组件（HOC）
- 支持 Hooks 与类组件
- 高性能，使用 Key-Value 而不是树型结构来处理状态
- 方法与状态都支持 TypeScript 静态检查
- 支持状态变更事件委托（拦截器）

### 目录

- [Demo](#demo)
  - [Todo List](https://csb-s8sbu.netlify.app/#/)
  - [计数器](https://csb-s8sbu.netlify.app/#/counter)
  - [性能测试](https://csb-s8sbu.netlify.app/#/benchmark) / [旧版本 v0.0.x 版性能测试](https://csb-byl1x.netlify.app/)
- [安装方式](#install)
- [快速使用](#quick-use)
- [API](#api)
- [高级用法](#advanced-use)
  - [函数式组件使用方式](#use-in-function-component)
  - [类组件使用使用方式](#use-in-class-component)
  - [使用 TypeScript 类型检查](#ts-check)
  - [获取当前时刻的状态](#get-current-state)
  - [事件委托-拦截器](#delegate)
  - [使用副作用](#effects)

### Demo<a id="demo"></a>

- 预览地址: https://csb-s8sbu.netlify.app/
- 在线编辑: https://codesandbox.io/s/strange-antonelli-s8sbu

### 安装方式<a id="install"></a>

```bash
yarn add rekv
```

版本要求：React 版本 >= 16.8.0


### 使用方法<a id="advanced-use"></a>

> 可创建多个 store，并对每个状态进行 TypeScript 静态检查

#### 函数式组件使用方式<a id="use-in-function-component"></a>

**使用 Rekv 创建一个 store**

```ts
// store.ts
import Rekv from 'rekv';

export default new Rekv({
  name: 'test',
  count: 0,
});
```

**使用状态**

```tsx
import React from 'react';
import store from './store';

export default function Demo() {
  const s = store.useState('name', 'count');

  return (
    <div>
      {s.name}, {s.count}
    </div>
  );
}
```

**在另一个组件内更新状态**

```tsx
import React from 'react';
import store from './store';

// 重置计数器
function reset() {
  store.setState({ count: 0 });
}

function increment() {
  store.setState((state) => ({ count: state.count + 1 }));
}

function decrement() {
  store.setState((state) => ({ count: state.count - 1 }));
}

export default function Buttons() {
  return (
    <div>
      <button onClick={reset}>reset</button>
      <button onClick={increment}>+1</button>
      <button onClick={decrement}>-1</button>
    </div>
  );
}
```

#### 在类组件中使用<a id="use-in-class-component"></a>

```tsx
import React, { Component } from 'react';
import store from './store';

export default class MyComponent extends Component {
  s = store.classUseState(this, 'count');

  render() {
    return <div>{this.s.count}</div>;
  }
}
```

#### 使用 TypeScript 类型检查<a id="ts-check"></a>

```tsx
// store.ts
import Rekv from 'rekv';

interface InitState {
  name: string;
  age?: number;
}

const initState: InitState = {
  name: 'Jack',
  age: 25,
};

const store = new Rekv(initState);

export default store;
```

```tsx
// User.ts
import React from 'react';
import store from './store';

export default function User() {
  // name 将被推断为 string 类型
  // age 将被推断为 number | undefined 类型
  const s = store.useState('name', 'age');

  return (
    <div>
      {s.name}, {s.age}
    </div>
  );
}
```

#### 获取当前时刻的状态<a id="get-current-state"></a>

```tsx
import store from './store';

// 获取当前时刻的状态
store.currentState;
// 或
store.getCurrentState(); // 兼容旧版本的 API
```

#### 事件委托、拦截器<a id="delegate"></a>

```tsx
import store from './store';

store.delegate = {
  beforeUpdate: ({ state }) => {
    console.log('beforeUpdate', state);
    // 可在这里拦截 setState 的值，并进行修改
    return state;
  },
  afterUpdate: ({ state }) => {
    // afterUpdate 的 state 只包含了需要更新的状态
    console.log('afterUpdate', state);
  },
};
```

#### 使用副作用<a id="effects"></a>

```tsx
import Rekv from 'rekv';

// 定义副使用
const store = new Rekv(
  { foo: 'bar', ret: null },
  {
    effects: {
      changeFoo(name: string) {
        this.setState({ foo: name });
      },
      // 定义异步副作用
      async loadResource() {
        const ret = await fetchUrl('...');
        this.setState({
          ret,
        });
      },
    },
  }
);

// 使用副作用
store.effects.changeFoo('hello');

// 使用异步副作用
await store.effects.loadResource();
```


### API

- class Rekv

  - new Rekv(object)

    > 创建一个 `Rekv` 的实例

  - `delegate` **全局事件委托**<a id="global-delegate"></a>

    > 全局事件委托，可设置所有 `Rekv` 实例的事件委托

    - `beforeUpdate` 状态更新前的事件，可对设置的状态进行拦截，检查并修改

      ```ts
      import Rekv from 'rekv';

      // 所有 `Rekv` 的实例，在更新前都将执行此方法
      // state: 使用 setState() 更新的状态值
      // store: 需要更新状态的 store
      // 返回值: 如果需要拦截并修改 setState 的值，可返回一个新的对象，替换 setState 的值
      Rekv.delegate.beforeUpdate = ({ state, store }) => {
        console.log(store.currentState, state);
        // return state;	// 可选，如果返回了新的值，则可实现对状态的拦截修改
      };
      ```

    - `afterUpdate` 状态更新后的事件，返回已更新的状态

      ```tsx
      import Rekv from 'rekv';

      // 所有的 `Rekv` 实例，在完成状态更新后，执行此方法
      // state: 已更新的状态（这里已过滤掉未发生改变的状态）
      // store: 已更新状态的 store
      Rekv.delegate.afterUpdate = ({ state, store }) => {
        console.log(store.currentState, state);
      };
      ```

- `globalStore`

  > globalStore 是一个默认创建的 `Rekv` 类的实例，可使用 `Rekv` 实例的所有方法与属性

- Rekv 实例属性与方法

  - `.delegate` 使用方式与 [全局事件委托](#global-delegate) 相同

    > 实例的事件委托，如果和全局的事件委托同时设置了，会**优先执行实例的事件委托**，再执行全局的事件委托，使用方式用全局事件委托相同

  - `.currentState` 获取当前时刻实例的状态

  - `.getCurrentState()` 与 `.currentState` 功能相同

  - `.useState()`

    > 在函数式组件中订阅并使用状态，通过设置多个参数，可在一行使用多个状态

    ```tsx
    import React from 'react';
    import store from './store';

    function Demo() {
      const s = store.useState('foo', 'bar');

      return (
        <div>
          {s.foo}, {s.bar}
        </div>
      );
    }
    ```

  - `.setState()` [对状态进行更新]()

    ```tsx
    import store from './store';
    // 方法1: 直接设置状态
    store.setState({ count: 1 });
    // 方法2: 使用一个回调函数，获取当前状态，并返回新的状态
    // state: 当前状态
    store.setState((state) => {
      return {
        count: state.count + 1,
      };
    });
    ```

  - `.classUseState()` [在类组件中使用状态](#use-in-class-component)

### License

[MIT licensed](./LICENSE)

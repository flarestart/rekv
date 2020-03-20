# Rekv

Rekv 是一个为 React 函数式组件设计的全局状态管理器

[![Travis CI][ci-image]][ci-url]
[![Coveralls][coverage-image]][coverage-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][downloads-url]

### 目录

- [Demo](#demo)
- [特色](#feature)
- [更新日志](#update-log)
- [安装方式](#install)
- [函数式组件使用方式](#using-in-function-component)
- [类组件使用使用方式](#using-in-class-component)
- [使用 TypeScript 类型检查](#ts-check)
- [获取当前时刻的状态](#get-current-state)

### Demo<a id="demo"></a>

Preview: https://csb-s8sbu.netlify.com/
CodeSandbox: https://codesandbox.io/s/strange-antonelli-s8sbu

### 特色<a id="feature"></a>

- 一个极简但易用的状态管理器
- 高性能，使用 Key-Value 而不是树型结构来处理状态
- 无 Redux，无依赖，仅 state
- 不使用高阶组件（HOC）
- TypeScript 友好

### 更新日志<a id="update-log"></a>

#### 1.0.0

**重要更新 使用方式与低版本不兼容**

- 性能提升、支持异步批量更新状态，使用 `unstable_batchedUpdates` 进行状态异步更新
- 类组件使用方式简化 `bindClassComponent` 方法 变更为 `classUseState`，删除 `unbindClassComponent` 方法
- useState 可使用多个状态名 `useState` 和 `classUseState` 支持一行获取多个状态名称

### 安装方式<a id="install"></a>

```bash
yarn add rekv
```

版本要求：React 版本 >= 16.8.0

### 函数式组件使用方式<a id="using-in-function-component"></a>

**使用 Rekv 创建一个 store**

```ts
// store.ts
import Rekv from 'rekv';

export default new Rekv({
  name: 'test',
  count: 0,
});
```

**使用全局状态**

```tsx
import React from 'react';
import store from './store';

export default function Demo() {
  const { name, count } = store.useState('name', 'count');

  return (
    <div>
      {name}, {count}
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

### 在类组件中使用<a id="using-in-class-component"></a>

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

### 使用 TypeScript 类型检查<a id="ts-check"></a>

**注意：这里使用的是大写的 Rekv，小写的 rekv 是 Rekv 的一个实例**

```tsx
// store.ts
import Rekv from 'rekv';

interface InitState {
  name: string;
  age?: number;
}

const store = new Rekv<InitState>({
  name: 'Jack',
  age: 25,
});

export default store;
```

```tsx
// User.ts
import React from 'react';
import store from './store';

export default function User() {
  const { name, age } = store.useState('name', 'age'); // name 将被推断为 string 类型

  return (
    <div>
      {name}, {age}
    </div>
  );
}
```

### 获取当前时刻的状态<a id="get-current-state"></a>

```tsx
import store from './store';

// 获取当前时刻的状态，如果需要订阅数据变化，可以参阅 useState
const currentState = store.getCurrentState();
```

[coverage-image]: https://img.shields.io/coveralls/flarestart/rekv.svg
[coverage-url]: https://coveralls.io/github/flarestart/rekv
[ci-image]: https://img.shields.io/travis/flarestart/rekv.svg?branch=master
[ci-url]: https://travis-ci.org/flarestart/rekv
[npm-image]: https://img.shields.io/npm/v/rekv.svg
[npm-url]: https://npmjs.org/package/rekv
[downloads-image]: http://img.shields.io/npm/dm/rekv.svg
[downloads-url]: https://npmjs.org/package/rekv

# Rekv

Rekv is a global state manager design for React Hooks and has good compatibility with Class Component.

[中文文档](./README_CN.md)

[![Travis CI][ci-image]][ci-url]
[![Coveralls][coverage-image]][coverage-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][downloads-url]

### Feature<a id="feature"></a>

- A simple but easy-to-use state manager, a file, only about 200 lines
- High performance, use Key-Value instead of tree structure to handle state
- Support TypeScript static check
- Support state change event delegation (interceptor)
- No Redux, no dependencies, only state
- Does not use higher-order components (HOC)

### Table of Contents

- [Demo](#demo)
  - [Todo List](https://csb-s8sbu.netlify.app/#/)
  - [Counter](https://csb-s8sbu.netlify.app/#/counter)
  - [Benchmark](https://csb-s8sbu.netlify.app/#/benchmark) / [Old Version v0.0.x Benchmark](https://csb-byl1x.netlify.app/)
- [Installation](#install)
- [Quickstart](#quick-use)
- [API](#api)
- [Advanced usage](#advanced-use)
  - [Use in Functional Component](#use-in-function-component)
  - [Use in Class Component](#use-in-class-component)
  - [Use TypeScript type checking](#ts-check)
  - [Get the current state](#get-current-state)
  - [Event delegate and interceptor](#delegate)
- [Update Log](#update-log)

### Demo<a id="demo"></a>

- Preview: https://csb-s8sbu.netlify.app/
- Online Editor: https://codesandbox.io/s/strange-antonelli-s8sbu

### Installation<a id="install"></a>

```bash
yarn add rekv
```

Requirements: React version >= 16.8.0

### Quickstart<a id="quick-use"></a>

> Suitable for small projects, only one global state is needed

```tsx
// Demo.tsx
import React from 'react';
import { globalStore } from 'rekv';

export default function Demo() {
  // Use global state
  const { name } = globalStore.useState('name');
  return <div>Hello, {name}</div>;
}

// Call in another file, or elsewhere
globalStore.setState({ name: 'Jack' });
```

### API

- class Rekv

  - new Rekv(object)

    > Create an instance of `Rekv`

  - `delegate` **Global event delegation**<a id="global-delegate"></a>

    > Global event delegation, you can set the event delegation of all `Rekv` instances

    - `beforeUpdate` The event before the state update can intercept, check and modify the set state

      ```ts
      import Rekv from 'rekv';

      // All instances of `Rekv` will execute this method before updating
      // state: State value updated using setState()
      // store: Store whose state is about to be updated
      // Return value: If you need to intercept and modify the value of setState, you can return a new object, replacing the value of setState
      Rekv.delegate.beforeUpdate = ({ state, store }) => {
        console.log(store.currentState, state);
        // return is optional, if a new value is returned, the interception and modification of the state can be achieved
        // return state;
      };
      ```

    - `afterUpdate` Event after state update, returns the updated state

      ```tsx
      import Rekv from 'rekv';

      // All instances of `Rekv` will execute this method before updating
      // state: The updated state (the unchanged state has been filtered out here)
      // store: Store with updated state
      Rekv.delegate.afterUpdate = ({ state, store }) => {
        console.log(store.currentState, state);
      };
      ```

- `globalStore`

  > `globalStore` is an instance of the `Rekv` class created by default, and all methods and properties of the`Rekv` instance can be used

- Rekv Instance properties and methods

  - `.delegate` is used in the same way as [Global event delegation](#global-delegate)

    > The event delegation of the instance, if it is set at the same time as the global event delegation, the instance event delegation will be executed first, and then the global event delegation will be executed, using the same way as the global event delegation

  - `.currentState` Get the state of the instance at the current moment

  - `.getCurrentState()` has the same function as `.currentState`

  - `.useState()`

    > Subscribe and use state in Function Components. By setting multiple parameters, you can use multiple state on one line

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

  - `.setState()` Update state

    ```tsx
    import store from './store';
    // Method 1: Set the state directly
    store.setState({ count: 1 });
    // Method 2: Use a callback function to get the current state and return the new state
    // state: Current state
    store.setState((state) => {
      return {
        count: state.count + 1,
      };
    });
    ```

  - `.classUseState()` [Use state in class components](#use-in-class-component)

### Advanced usage<a id="advanced-use"></a>

> Applicable to multiple stores, TypeScript static check can be performed for each state

#### Use in Functional Component<a id="use-in-function-component"></a>

**Use Rekv to create a store**

```ts
// store.ts
import Rekv from 'rekv';

export default new Rekv({
  name: 'test',
  count: 0,
});
```

**Use state**

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

**Update state in another component**

```tsx
import React from 'react';
import store from './store';

// Reset counter
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

#### Use in Class Component<a id="use-in-class-component"></a>

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

#### Use TypeScript type checking<a id="ts-check"></a>

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
  // name will be inferred as type string
  // age will be inferred as number | undefined type
  const { name, age } = store.useState('name', 'age');

  return (
    <div>
      {name}, {age}
    </div>
  );
}
```

#### Get the current state<a id="get-current-state"></a>

```tsx
import store from './store';

// Get the current state
store.currentState;
// or
store.getCurrentState(); // Compatible with older APIs
```

#### Event delegate and interceptor<a id="delegate"></a>

```tsx
import store from './store';

store.delegate = {
  beforeUpdate: ({ state }) => {
    console.log('beforeUpdate', state);
    // The value of setState() can be intercepted here and modified
    return state;
  },
  afterUpdate: ({ state }) => {
    // The state of afterUpdate contains only the state that needs to be updated
    console.log('afterUpdate', state);
  },
};
```

### Update Log<a id="update-log"></a>

#### 1.1.0

- Add quickstart method, can be used directly globalStore
- Add event delegate `beforeUpdate` and `afterUpdate`

#### 1.0.0

**Important update Usage is not compatible with earlier versions**

- Performance improvement, support for asynchronous batch update state, use `unstable_batchedUpdates` for asynchronous state update
- Simplified use of class components `bindClassComponent` method changed to `classUseState`, removed `unbindClassComponent` method
- `useState` can use multiple state names `useState` and `classUseState` support one line to get multiple state names

[coverage-image]: https://img.shields.io/coveralls/flarestart/rekv.svg
[coverage-url]: https://coveralls.io/github/flarestart/rekv
[ci-image]: https://img.shields.io/travis/flarestart/rekv.svg?branch=master
[ci-url]: https://travis-ci.org/flarestart/rekv
[npm-image]: https://img.shields.io/npm/v/rekv.svg
[npm-url]: https://npmjs.org/package/rekv
[downloads-image]: http://img.shields.io/npm/dm/rekv.svg
[downloads-url]: https://npmjs.org/package/rekv

// MIT License
//
// Copyright (c) 2019 flarestart
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { useState, Component, useEffect } from 'react';

/* istanbul ignore next */
function noBatchUpdates(fn: () => void) {
  return fn();
}

function loadFromReactDOM() {
  try {
    const r = require('react-dom');
    if (typeof r.unstable_batchedUpdates === 'function') {
      return r.unstable_batchedUpdates;
    }
  } catch (e) {
    // do nothing
  }
}

/* istanbul ignore next */
function loadFromReactNative() {
  try {
    const r = require('react-native');
    if (typeof r.unstable_batchedUpdates === 'function') {
      return r.unstable_batchedUpdates;
    }
  } catch (e) {
    // do nothing
  }
}

const batchUpdates = loadFromReactDOM() || loadFromReactNative() || noBatchUpdates;

type EventCallback = () => void;

interface InitState {
  [key: string]: any;
}

function isPlainObject(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null) return false;

  let proto = obj;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  // proto = null
  return Object.getPrototypeOf(obj) === proto;
}

export class Rekv<T extends InitState> {
  constructor(initState: T) {
    if (!isPlainObject(initState)) {
      throw new Error('init state is not a plain object');
    }
    this.state = initState;
  }

  private events: { [key: string]: EventCallback[] } = {};
  private state: any = {};

  on(name: any, callback: EventCallback): void {
    let s = this.events[name];
    if (!s) {
      this.events[name] = [callback];
    } else {
      if (s.indexOf(callback) < 0) {
        s.push(callback);
      }
    }
  }

  off(name: any, callback: EventCallback): void {
    const s = this.events[name];
    if (s) {
      const index = s.indexOf(callback);
      if (index >= 0) {
        s.splice(index, 1);
      }
    }
  }

  setState<P extends Partial<T>>(param: P | ((state: T) => P)): void {
    let kvs: P;
    if (typeof param === 'function') {
      kvs = param(this.state);
    } else {
      kvs = param;
    }
    if (!isPlainObject(kvs)) {
      throw new Error(`setState() only receive an plain object`);
    }
    const keys = Object.keys(kvs);
    keys.forEach((key) => {
      this.state[key] = kvs[key];
    });
    batchUpdates(() => {
      const called: EventCallback[] = [];
      keys.forEach((key) => {
        const callbacks = this.events[key];
        if (callbacks) {
          callbacks.forEach((callback) => {
            if (called.indexOf(callback) < 0) {
              called.push(callback);
              callback();
            }
          });
        }
      });
    });
  }

  useState = <K extends keyof T>(...keys: K[]): Pick<T, K> => {
    const [value, setValue] = useState(() => {
      const v: any = {};
      keys.forEach((key) => (v[key] = this.state[key]));
      return v;
    });

    useEffect(() => {
      const updater = () => {
        const v: any = {};
        keys.forEach((key) => (v[key] = this.state[key]));
        setValue(v);
      };
      keys.forEach((key) => {
        this.on(key, updater);
      });
      return () => {
        keys.forEach((key) => this.off(key, updater));
      };
    }, keys);
    return value;
  };

  classUseState<K extends keyof T>(component: Component, ...keys: K[]): Pick<T, K> {
    const ret: any = {};
    const unmount = component.componentWillUnmount;
    const updater = () => {
      component.forceUpdate();
    };
    keys.forEach((key) => {
      this.on(key, updater);
      Object.defineProperty(ret, key, {
        get: () => {
          return this.state[key];
        },
      });
    });
    component.componentWillUnmount = () => {
      keys.forEach((key) => {
        this.off(key, updater);
      });
      if (typeof unmount === 'function') {
        unmount.call(component);
      }
    };
    return ret;
  }

  getCurrentState(): Readonly<T> {
    return this.state;
  }
}

export default Rekv;

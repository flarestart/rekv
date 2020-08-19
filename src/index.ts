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

function isFunction(fn: any): fn is Function {
  return typeof fn === 'function';
}

let batchUpdates: Function = noBatchUpdates;
import('./batchedUpdates').then(
  (r) => {
    /* istanbul ignore next */
    if (isFunction(r.unstable_batchedUpdates)) {
      batchUpdates = r.unstable_batchedUpdates;
    }
  },
  () => {}
);

type EventCallback = (v: any) => void;

type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepReadonlyObject<T>
  : T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

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

interface RekvDelegate<T, K> {
  beforeUpdate?: (e: { store: T; state: Readonly<K> }) => K | void;
  afterUpdate?: (e: { store: T; state: Readonly<K> }) => void;
}

export class Rekv<T extends InitState> {
  public static delegate: RekvDelegate<Rekv<any>, any> = {};
  public delegate: RekvDelegate<this, Partial<T>> = {};

  private _events: any = {};
  private _updateId = 0;
  private _state: any = {};
  private _inDelegate = false;

  constructor(initState: T) {
    if (!isPlainObject(initState)) {
      throw new Error('init state is not a plain object');
    }
    this._state = initState;
  }

  on<K extends keyof T>(name: K, callback: EventCallback): void {
    const s = this._events[name];
    if (!s) {
      this._events[name] = [callback];
    } else if (s.indexOf(callback) < 0) {
      s.push(callback);
    }
  }

  off<K extends keyof T>(name: K, callback: EventCallback): void {
    const s = this._events[name];
    if (s) {
      const index = s.indexOf(callback);
      if (index >= 0) {
        s.splice(index, 1);
      }
    }
  }

  setState(param: Partial<T> | ((s: T) => Partial<T>)): void {
    let kvs: Partial<T>;
    if (isFunction(param)) {
      kvs = param(this._state);
    } else {
      kvs = param;
    }
    if (!this._inDelegate) {
      this._inDelegate = true;
      if (this.delegate && isFunction(this.delegate.beforeUpdate)) {
        const ret = this.delegate.beforeUpdate({ store: this, state: kvs });
        if (ret) {
          kvs = ret;
        }
      }
      if (Rekv.delegate && isFunction(Rekv.delegate.beforeUpdate)) {
        const ret = Rekv.delegate.beforeUpdate({ store: this, state: kvs });
        if (ret) {
          kvs = ret;
        }
      }
      this._inDelegate = false;
    }
    if (!isPlainObject(kvs)) {
      throw new Error('setState() only receive an plain object');
    }
    const keys = Object.keys(kvs);
    const needUpdateKeys: any[] = [];
    const updatedValues: any = {};
    keys.forEach((key) => {
      if (this._state[key] !== kvs[key]) {
        needUpdateKeys.push(key);
        updatedValues[key] = kvs[key];
        this._state[key] = kvs[key];
      }
    });

    this.forceUpdate(...needUpdateKeys);

    if (!this._inDelegate) {
      this._inDelegate = true;
      if (this.delegate && isFunction(this.delegate.afterUpdate)) {
        this.delegate.afterUpdate({ store: this, state: updatedValues });
      }
      if (Rekv.delegate && isFunction(Rekv.delegate.afterUpdate)) {
        Rekv.delegate.afterUpdate({ store: this, state: updatedValues });
      }
      this._inDelegate = false;
    }
  }

  useState = <K extends keyof T>(...keys: K[]): Readonly<Pick<T, K>> => {
    const [value, setValue] = useState(() => {
      const v: any = {};
      keys.forEach((key) => {
        v[key] = this._state[key];
      });
      return v;
    });

    useEffect(() => {
      const updater = () => {
        const v: any = {};
        keys.forEach((key) => {
          v[key] = this._state[key];
        });
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

  classUseState<K extends keyof T>(component: Component, ...keys: K[]): Readonly<Pick<T, K>> {
    const ret: any = {};
    const unmount = component.componentWillUnmount;
    const updater = () => {
      component.forceUpdate();
    };
    keys.forEach((key) => {
      this.on(key, updater);
      Object.defineProperty(ret, key, {
        get: () => this._state[key],
      });
    });
    component.componentWillUnmount = () => {
      keys.forEach((key) => {
        this.off(key, updater);
      });
      if (isFunction(unmount)) {
        unmount.call(component);
      }
    };
    return ret;
  }

  get currentState(): DeepReadonly<T> {
    return this._state;
  }

  getCurrentState(): DeepReadonly<T> {
    return this._state;
  }

  forceUpdate<K extends keyof T>(...keys: K[]) {
    if (keys.length <= 0) {
      return;
    }
    let updated = false;
    batchUpdates(() => {
      keys.forEach((key: any) => {
        const callbacks: any[] = this._events[key];
        if (callbacks) {
          callbacks.forEach((callback) => {
            // check if callback has been updated
            if (callback.updateId !== this._updateId) {
              /* eslint-disable-next-line */
              callback.updateId = this._updateId;
              callback(this._state[key]);
            }
          });
          updated = true;
        }
      });
    });
    if (updated) {
      /* eslint-disable-next-line */
      this._updateId++;
      /* istanbul ignore next */
      if (this._updateId >= Number.MAX_SAFE_INTEGER) {
        this._updateId = 0;
      }
    }
  }
}

export default Rekv;
export const globalStore = new Rekv<any>({});

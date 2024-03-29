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
import {
  isFunction,
  isPlainObject,
  InitState,
  RekvDelegate,
  DeepReadonly,
  MapEffects,
  SubscribeCallback,
} from './utils';

// Use batch updates to improve performance
// unstable_batchedUpdates is provided by react-dom or react-native
// In react-native `batchedUpdates.native.js` have a higher priority than
// `batchedUpdates.js`, so react-native will work correct
//
// istanbul ignore next
let batchUpdates = (fn: () => void) => fn();
import('./batchedUpdates')
  .then((r) => {
    // istanbul ignore next
    if (isFunction(r.unstable_batchedUpdates)) {
      batchUpdates = r.unstable_batchedUpdates;
    }
  })
  .catch(() => {
    // ignore import error
  });

export class Rekv<
  T extends InitState,
  E = {
    [key: string]: (
      this: Pick<Rekv<T, any>, 'currentState' | 'setState' | 'on' | 'off'>,
      ...args: any[]
    ) => void;
  }
> {
  public static delegate: RekvDelegate<Rekv<any, any>, any> = {};
  public delegate: RekvDelegate<this, Partial<T>> = {};
  public effects: MapEffects<E>;

  private _events: any = {};
  private _updateId = 0;
  private _state: any = {};
  private _inDelegate = false;

  constructor(initState: T, options?: { effects: E }) {
    if (!isPlainObject(initState)) {
      throw new Error('init state is not a plain object');
    }
    this._state = initState;
    const effects: any = {};
    if (options && options.effects) {
      const effectKeys = Object.keys(options.effects);
      for (let i = 0, len = effectKeys.length; i < len; i++) {
        const key = effectKeys[i];
        const func = (options.effects as any)[key];
        effects[key] = (...args: any[]) => func.call(this, ...args);
      }
    }
    this.effects = effects;
  }

  /**
   * Add changed listener to a key
   * @param name key name
   * @param callback key changed listener
   */
  on<K extends keyof T>(name: K, callback: SubscribeCallback<T[K]>): void {
    const s = this._events[name];
    if (!s) {
      this._events[name] = [callback];
    } else if (s.indexOf(callback) < 0) {
      s.push(callback);
    }
  }

  /**
   * Remove changed listener to a key
   * @param name key name
   * @param callback key changed listener
   */
  off<K extends keyof T>(name: K, callback: SubscribeCallback<T[K]>): void {
    const s = this._events[name];
    if (s) {
      const index = s.indexOf(callback);
      if (index >= 0) {
        s.splice(index, 1);
      }
    }
  }

  /**
   * setState is the only way to change states in Rekv
   * @param param new state, an object or a function returns an object
   */
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
    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      if (this._state[key] !== kvs[key]) {
        needUpdateKeys.push(key);
        updatedValues[key] = kvs[key];
        this._state[key] = kvs[key];
      }
    }

    if (needUpdateKeys.length > 0) {
      this._state = { ...this._state };
      this.updateComponents(...needUpdateKeys);
    }

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

  /**
   * Rekv support for React Hooks
   * @param keys the keys to be watched, if the watched keys has been changed,
   * the component will be updated and all state will return
   * @returns all state after change
   */
  useState = <K extends keyof T>(...keys: K[]): DeepReadonly<T> => {
    const [value, setValue] = useState(() => this._state);

    useEffect(() => {
      const updater = () => {
        // trigger react rerender
        setValue(this._state);
      };
      for (let i = 0, len = keys.length; i < len; i++) {
        this.on(keys[i], updater);
      }
      return () => {
        for (let i = 0, len = keys.length; i < len; i++) {
          this.off(keys[i], updater);
        }
      };
    }, keys);
    return value;
  };

  /**
   * Rekv support for React class Component
   * @param component instance of current class Component
   * @param keys the keys to be watched, if the watched keys has been changed,
   * the component will be updated and all state will return
   * @returns all state after change
   */
  classUseState<K extends keyof T>(
    component: Component,
    ...keys: K[]
  ): DeepReadonly<T> {
    const unmount = component.componentWillUnmount;
    const updater = () => {
      component.forceUpdate();
    };
    for (let i = 0, len = keys.length; i < len; i++) {
      this.on(keys[i], updater);
    }
    component.componentWillUnmount = () => {
      for (let i = 0, len = keys.length; i < len; i++) {
        this.off(keys[i], updater);
      }
      if (isFunction(unmount)) {
        unmount.call(component);
      }
    };
    return this._state;
  }

  get currentState(): DeepReadonly<T> {
    return this._state;
  }

  getCurrentState(): DeepReadonly<T> {
    return this._state;
  }

  updateComponents<K extends keyof T>(...keys: K[]) {
    batchUpdates(() => {
      for (let i = 0, keysLen = keys.length; i < keysLen; i++) {
        const key = keys[i];
        const updaters: any[] = this._events[key];
        if (Array.isArray(updaters)) {
          for (let j = 0, updaterLen = updaters.length; j < updaterLen; j++) {
            const updater = updaters[j];
            // check whether the updater has been updated, the same updater may watch different keys
            if (updater.updateId !== this._updateId) {
              updater.updateId = this._updateId;
              updater(this._state[key]);
            }
          }
        }
      }
    });
    this._updateId++;
    // istanbul ignore next
    if (this._updateId >= 2147483647) {
      // _updateId will be reset to zero to avoid overflow (2147483647 is 2**31-1)
      this._updateId = 0;
    }
  }
}

export const globalStore = new Rekv<any, never>({});
export default Rekv;

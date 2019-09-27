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

import { useState, useEffect, Component } from 'react';

type EventCallback = (value: any) => void;

interface ComponentInfo {
  keys: string[];
  selector: { [key: string]: string | true };
  component: Component;
}

interface InitState {
  [key: string]: any;
}

// check if two array have same values
function isCross(a: any[], b: any[]): boolean {
  for (let n = 0; n < a.length; n++) {
    if (b.indexOf(a[n]) >= 0) {
      return true;
    }
  }
  return false;
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
  constructor(options?: { initState: T }) {
    if (options && options.initState) {
      if (!isPlainObject(options.initState)) {
        throw new Error('init state is not a plain object');
      }
      this.state = options.initState;
    }
  }

  private events: { [key: string]: EventCallback[] } = {};
  private state: any = {};
  private components: ComponentInfo[] = [];

  on(name: any, callback: EventCallback): void {
    let s = this.events[name];
    if (!s) {
      s = [];
      s.push(callback);
      this.events[name] = s;
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

  setState(param: Partial<T> | ((state: T) => Partial<T>)): void {
    let kvs: Partial<T>;
    if (typeof param === 'function') {
      kvs = param(this.state);
    } else {
      kvs = param;
    }
    if (!isPlainObject(kvs)) {
      throw new Error(`setState() only receive an plain object`);
    }
    const keys = Object.keys(kvs);
    keys.forEach(key => {
      const value = kvs[key];
      this.state[key] = value;
      const callbacks = this.events[key];
      if (callbacks) {
        callbacks.forEach(callback => {
          callback(value);
        });
      }
    });
    this.components.forEach(item => {
      if (isCross(item.keys, keys)) {
        const values: any = {};
        item.keys.forEach(key => {
          const mapKey = item.selector[key];
          if(mapKey === true){
            values[key] = this.state[key];
          }else if(typeof mapKey === 'string') {
            values[mapKey] = this.state[key];
          }
        });
        item.component.setState(values);
      }
    });
  }

  useState<K extends keyof T>(key: K): T[K] {
    const [value, setValue] = useState(this.state[key]);

    useEffect(() => {
      this.on(key, setValue);
      return () => {
        this.off(key, setValue);
      };
    }, [key]);
    return value;
  }

  // useMulti<K extends keyof T>(select: { [_ in K]: string }): Pick<T, K> {
  //   const keys = Object.keys(select);
  //   const values: any = {};
  //   keys.forEach(key => {
  //     values[key] = this.states[key];
  //   });
  //   let [value, setValue] = useState(values);

  //   useEffect(() => {
  //     // this.on(key, setValue);
  //     console.log('bind', select);
  //     return () => {
  //       // this.off(key, setValue);
  //       console.log('unbind', select);
  //     };
  //   }, [select]);
  //   return value;
  // }

  // bind React class component
  bindClassComponent<K extends keyof T>(component: Component, selector: { [_ in K]: string | true }): void {
    // ignore empty keys
    const keys = Object.keys(selector);
    if (keys.length <= 0) {
      return;
    }
    const values: any = {};
    const s: any = selector;
    keys.forEach(key => {
      const v = this.state[key];
      if (typeof v !== 'undefined') {
        values[s[key]] = v;
      }
    });
    component.setState(values);
    // find if component exists
    let found = false;
    for (let n = 0; n < this.components.length; n++) {
      if (this.components[n].component === component) {
        found = true;
        break;
      }
    }
    if (!found) {
      this.components.push({
        keys,
        selector,
        component,
      });
    }
  }

  unbindClassComponent(component: Component): void {
    for (let n = 0; n < this.components.length; n++) {
      if (this.components[n].component === component) {
        this.components.splice(n, 1);
        break;
      }
    }
  }

  getCurrentState(): Readonly<T> {
    return this.state;
  }

  setInitState(obj: { [key: string]: any }) {
    if (!isPlainObject(obj)) {
      throw new Error('init state is not a plain object');
    }
    const kv: any = {};
    let needChange = false;
    Object.keys(obj).forEach(key => {
      // if key
      if (typeof key === 'undefined' || typeof this.state[key] !== 'undefined') {
        return;
      }
      needChange = true;
      kv[key] = obj[key];
    });
    if (needChange) {
      this.setState(kv);
    }
  }
}

export const rekv = new Rekv<any>();

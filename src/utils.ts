// TypeScript generics used to set an object deep readonly
export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepReadonlyObject<T>
  : T;

export type DeepReadonlyArray<T> = ReadonlyArray<DeepReadonly<T>>;

export type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

// MapEffects used to export Effects functions definition to
export type MapEffects<T> = {
  [P in keyof T]: T[P] extends (...args: infer U) => infer R ? (...args: U) => R : T;
};

export type SubscribeCallback<T> = (v: T) => void;

export interface InitState {
  [key: string]: any;
}

export interface RekvDelegate<T, K> {
  beforeUpdate?: (e: { store: T; state: Readonly<K> }) => K | void;
  afterUpdate?: (e: { store: T; state: Readonly<K> }) => void;
}

export function isFunction(fn: any): fn is Function {
  return typeof fn === 'function';
}

export function isPlainObject(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null) return false;

  let proto = obj;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  // proto = null
  return Object.getPrototypeOf(obj) === proto;
}

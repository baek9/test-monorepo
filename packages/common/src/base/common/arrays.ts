// baek9 : Completed
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { findFirstIdxMonotonousOrArrLen } from './arraysFind.js';
//import { CancellationToken } from './cancellation.js';
//import { CancellationError } from './errors.js';
//import { ISplice } from './sequence.js';

/**
 * Returns the last entry and the initial N-1 entries of the array, as a tuple of [rest, last].
 *
 * The array must have at least one element.
 *
 * @param arr The input array
 * @returns A tuple of [rest, last] where rest is all but the last element and last is the last element
 * @throws Error if the array is empty
 */
export function tail<T>(arr: T[]): [T[], T] {
  if (arr.length === 0) {
    throw new Error('Invalid tail call');
  }

  return [arr.slice(0, arr.length - 1), arr[arr.length - 1]];
}

export function equals<T>(
  one: ReadonlyArray<T> | undefined,
  other: ReadonlyArray<T> | undefined,
  itemEquals: (a: T, b: T) => boolean = (a, b) => a === b,
): boolean {
  if (one === other) {
    return true;
  }

  if (!one || !other) {
    return false;
  }

  if (one.length !== other.length) {
    return false;
  }

  for (let i = 0, len = one.length; i < len; i++) {
    if (!itemEquals(one[i], other[i])) {
      return false;
    }
  }

  return true;
}

/**
 * Performs a binary search algorithm over a sorted array.
 *
 * @param array The array being searched.
 * @param key The value we search for.
 * @param comparator A function that takes two array elements and returns zero
 *   if they are equal, a negative number if the first element precedes the
 *   second one in the sorting order, or a positive number if the second element
 *   precedes the first one.
 * @return See {@link binarySearch2}
 */
export function binarySearch<T>(
  array: ReadonlyArray<T>,
  key: T,
  comparator: (op1: T, op2: T) => number,
): number {
  return binarySearch2(array.length, (i) => comparator(array[i], key));
}

/**
 * Performs a binary search algorithm over a sorted collection. Useful for cases
 * when we need to perform a binary search over something that isn't actually an
 * array, and converting data to an array would defeat the use of binary search
 * in the first place.
 *
 * @param length The collection length.
 * @param compareToKey A function that takes an index of an element in the
 *   collection and returns zero if the value at this index is equal to the
 *   search key, a negative number if the value precedes the search key in the
 *   sorting order, or a positive number if the search key precedes the value.
 * @return A non-negative index of an element, if found. If not found, the
 *   result is -(n+1) (or ~n, using bitwise notation), where n is the index
 *   where the key should be inserted to maintain the sorting order.
 */
export function binarySearch2(
  length: number,
  compareToKey: (index: number) => number,
): number {
  let low = 0,
    high = length - 1;

  while (low <= high) {
    const mid = ((low + high) / 2) | 0;
    const comp = compareToKey(mid);
    if (comp < 0) {
      low = mid + 1;
    } else if (comp > 0) {
      high = mid - 1;
    } else {
      return mid;
    }
  }
  return -(low + 1);
}

type Compare<T> = (a: T, b: T) => number;

export function quickSelect<T>(nth: number, data: T[], compare: Compare<T>): T {
  nth = nth | 0;

  if (nth >= data.length) {
    throw new TypeError('invalid index');
  }

  const pivotValue = data[Math.floor(data.length * Math.random())];
  const lower: T[] = [];
  const higher: T[] = [];
  const pivots: T[] = [];

  for (const value of data) {
    const val = compare(value, pivotValue);
    if (val < 0) {
      lower.push(value);
    } else if (val > 0) {
      higher.push(value);
    } else {
      pivots.push(value);
    }
  }

  if (nth < lower.length) {
    return quickSelect(nth, lower, compare);
  } else if (nth < lower.length + pivots.length) {
    return pivots[0];
  } else {
    return quickSelect(nth - (lower.length + pivots.length), higher, compare);
  }
}

export function groupBy<T>(
  data: ReadonlyArray<T>,
  compare: (a: T, b: T) => number,
): T[][] {
  const result: T[][] = [];
  let currentGroup: T[] | undefined = undefined;
  for (const element of data.slice(0).sort(compare)) {
    if (!currentGroup || compare(currentGroup[0], element) !== 0) {
      currentGroup = [element];
      result.push(currentGroup);
    } else {
      currentGroup.push(element);
    }
  }
  return result;
}

/**
 * Returns the top N elements from the array.
 *
 * Faster than sorting the entire array when the array is a lot larger than N.
 *
 * @param array The unsorted array.
 * @param compare A sort function for the elements.
 * @param n The number of elements to return.
 * @return The first n elements from array when sorted with compare.
 */
export function top<T>(
  array: ReadonlyArray<T>,
  compare: (a: T, b: T) => number,
  n: number,
): T[] {
  if (n === 0) {
    return [];
  }
  const result = array.slice(0, n).sort(compare);
  topStep(array, compare, result, n, array.length);
  return result;
}

function topStep<T>(
  array: ReadonlyArray<T>,
  compare: (a: T, b: T) => number,
  result: T[],
  i: number,
  m: number,
): void {
  for (const n = result.length; i < m; i++) {
    const element = array[i];
    if (compare(element, result[n - 1]) < 0) {
      result.pop();
      const j = findFirstIdxMonotonousOrArrLen(
        result,
        (e) => compare(element, e) < 0,
      );
      result.splice(j, 0, element);
    }
  }
}

/**
 * @returns New array with all falsy values removed. The original array IS NOT modified.
 */
export function coalesce<T>(array: ReadonlyArray<T | undefined | null>): T[] {
  return array.filter((e): e is T => !!e);
}

/**
 * Remove all falsy values from `array`. The original array IS modified.
 */
export function coalesceInPlace<T>(
  array: Array<T | undefined | null>,
): asserts array is Array<T> {
  let to = 0;
  for (let i = 0; i < array.length; i++) {
    if (!!array[i]) {
      array[to] = array[i];
      to += 1;
    }
  }
  array.length = to;
}

/**
 * @deprecated Use `Array.copyWithin` instead
 */
export function move(array: unknown[], from: number, to: number): void {
  array.splice(to, 0, array.splice(from, 1)[0]);
}

/**
 * @returns false if the provided object is an array and not empty.
 */
export function isFalsyOrEmpty(obj: unknown): boolean {
  return !Array.isArray(obj) || obj.length === 0;
}

/**
 * @returns True if the provided object is an array and has at least one element.
 */
export function isNonEmptyArray<T>(obj: T[] | undefined | null): obj is T[];
export function isNonEmptyArray<T>(
  obj: readonly T[] | undefined | null,
): obj is readonly T[];
export function isNonEmptyArray<T>(
  obj: T[] | readonly T[] | undefined | null,
): obj is T[] | readonly T[] {
  return Array.isArray(obj) && obj.length > 0;
}

/**
 * Removes duplicates from the given array. The optional keyFn allows to specify
 * how elements are checked for equality by returning an alternate value for each.
 */
export function distinct<T>(
  array: ReadonlyArray<T>,
  keyFn: (value: T) => unknown = (value) => value,
): T[] {
  const seen = new Set<any>();

  return array.filter((element) => {
    const key = keyFn!(element);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function uniqueFilter<T, R>(keyFn: (t: T) => R): (t: T) => boolean {
  const seen = new Set<R>();

  return (element) => {
    const key = keyFn(element);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  };
}

export function commonPrefixLength<T>(
  one: ReadonlyArray<T>,
  other: ReadonlyArray<T>,
  equals: (a: T, b: T) => boolean = (a, b) => a === b,
): number {
  let result = 0;

  for (
    let i = 0, len = Math.min(one.length, other.length);
    i < len && equals(one[i], other[i]);
    i++
  ) {
    result++;
  }

  return result;
}

export function range(to: number): number[];
export function range(from: number, to: number): number[];
export function range(arg: number, to?: number): number[] {
  let from = typeof to === 'number' ? arg : 0;

  if (typeof to === 'number') {
    from = arg;
  } else {
    from = 0;
    to = arg;
  }

  const result: number[] = [];

  if (from <= to) {
    for (let i = from; i < to; i++) {
      result.push(i);
    }
  } else {
    for (let i = from; i > to; i--) {
      result.push(i);
    }
  }

  return result;
}

export function index<T>(
  array: ReadonlyArray<T>,
  indexer: (t: T) => string,
): { [key: string]: T };
export function index<T, R>(
  array: ReadonlyArray<T>,
  indexer: (t: T) => string,
  mapper: (t: T) => R,
): { [key: string]: R };
export function index<T, R>(
  array: ReadonlyArray<T>,
  indexer: (t: T) => string,
  mapper?: (t: T) => R,
): { [key: string]: R } {
  return array.reduce((r, t) => {
    r[indexer(t)] = mapper ? mapper(t) : t;
    return r;
  }, Object.create(null));
}

/**
 * Inserts an element into an array. Returns a function which, when
 * called, will remove that element from the array.
 *
 * @deprecated In almost all cases, use a `Set<T>` instead.
 */
export function insert<T>(array: T[], element: T): () => void {
  array.push(element);

  return () => remove(array, element);
}

/**
 * Removes an element from an array if it can be found.
 *
 * @deprecated In almost all cases, use a `Set<T>` instead.
 */
export function remove<T>(array: T[], element: T): T | undefined {
  const index = array.indexOf(element);
  if (index > -1) {
    array.splice(index, 1);

    return element;
  }

  return undefined;
}

/**
 * Insert `insertArr` inside `target` at `insertIndex`.
 * Please don't touch unless you understand https://jsperf.com/inserting-an-array-within-an-array
 */
export function arrayInsert<T>(
  target: T[],
  insertIndex: number,
  insertArr: T[],
): T[] {
  const before = target.slice(0, insertIndex);
  const after = target.slice(insertIndex);
  return before.concat(insertArr, after);
}

/**
 * Uses Fisher-Yates shuffle to shuffle the given array
 */
export function shuffle<T>(array: T[], _seed?: number): void {
  let rand: () => number;

  if (typeof _seed === 'number') {
    let seed = _seed;
    // Seeded random number generator in JS. Modified from:
    // https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
    rand = () => {
      const x = Math.sin(seed++) * 179426549; // throw away most significant digits and reduce any potential bias
      return x - Math.floor(x);
    };
  } else {
    rand = Math.random;
  }

  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

/**
 * Pushes an element to the start of the array, if found.
 */
export function pushToStart<T>(arr: T[], value: T): void {
  const index = arr.indexOf(value);

  if (index > -1) {
    arr.splice(index, 1);
    arr.unshift(value);
  }
}

/**
 * Pushes an element to the end of the array, if found.
 */
export function pushToEnd<T>(arr: T[], value: T): void {
  const index = arr.indexOf(value);

  if (index > -1) {
    arr.splice(index, 1);
    arr.push(value);
  }
}

export function pushMany<T>(arr: T[], items: ReadonlyArray<T>): void {
  for (const item of items) {
    arr.push(item);
  }
}

export function mapArrayOrNot<T, U>(items: T | T[], fn: (_: T) => U): U | U[] {
  return Array.isArray(items) ? items.map(fn) : fn(items);
}

export function asArray<T>(x: T | T[]): T[];
export function asArray<T>(x: T | readonly T[]): readonly T[];
export function asArray<T>(x: T | T[]): T[] {
  return Array.isArray(x) ? x : [x];
}

export function getRandomElement<T>(arr: T[]): T | undefined {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * When comparing two values,
 * a negative number indicates that the first value is less than the second,
 * a positive number indicates that the first value is greater than the second,
 * and zero indicates that neither is the case.
 */
export type CompareResult = number;

/**
 * A comparator `c` defines a total order `<=` on `T` as following:
 * `c(a, b) <= 0` iff `a` <= `b`.
 * We also have `c(a, b) == 0` iff `c(b, a) == 0`.
 */
export type Comparator<T> = (a: T, b: T) => CompareResult;

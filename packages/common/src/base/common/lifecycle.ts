import { Iterable } from './iterator.js';

/**
 * Enables logging of potentially leaked disposables.
 *
 * A disposable is considered leaked if it is not disposed or not registered as the child of
 * another disposable. This tracking is very simple an only works for classes that either
 * extend Disposable or use a DisposableStore. This means there are a lot of false positives.
 */
const TRACK_DISPOSABLES = false;

const __is_disposable_tracked__ = '__is_disposable_tracked__';

export interface IDisposable {
  dispose(): void;
}

export function dispose<T extends IDisposable>(disposable: T): T;
export function dispose<T extends IDisposable>(
  disposable: T | undefined,
): T | undefined;
export function dispose<
  T extends IDisposable,
  A extends IterableIterator<T> = IterableIterator<T>,
>(disposables: IterableIterator<T>): A;
export function dispose<T extends IDisposable>(disposables: Array<T>): Array<T>;
export function dispose<T extends IDisposable>(
  disposables: ReadonlyArray<T>,
): ReadonlyArray<T>;
export function dispose<T extends IDisposable>(
  arg: T | IterableIterator<T> | undefined,
): any {
  if (Iterable.is(arg)) {
    let errors: any[] = [];

    for (const d of arg) {
      if (d) {
        try {
          d.dispose();
        } catch (e) {
          errors.push(e);
        }
      }
    }

    if (errors.length === 1) {
      throw errors[0];
    } else if (errors.length > 1) {
      throw new MultiDisposeError(errors);
    }

    return Array.isArray(arg) ? [] : arg;
  } else if (arg) {
    arg.dispose();
    return arg;
  }
}

export function combinedDisposable(...disposables: IDisposable[]): IDisposable {
  return trackDisposable({ dispose: () => dispose(disposables) });
}

export function toDisposable(fn: () => void): IDisposable {
  const self = trackDisposable({
    dispose: () => {
      //markTracked(self);
      fn();
    },
  });
  return self;
}

export class DisposableStore implements IDisposable {
  static DISABLE_DISPOSED_WARNING = false;

  private _toDispose = new Set<IDisposable>();
  private _isDisposed = false;

  /**
   * Dispose of all registered disposables and mark this object as disposed.
   *
   * Any future disposables added to this object will be disposed of on `add`.
   */
  public dispose(): void {
    if (this._isDisposed) {
      return;
    }

    this._isDisposed = true;
    this.clear();
  }

  /**
   * Dispose of all registered disposables but do not mark this object as disposed.
   */
  public clear(): void {
    try {
      dispose(this._toDispose.values());
    } finally {
      this._toDispose.clear();
    }
  }

  public add<T extends IDisposable>(t: T): T {
    if (!t) {
      return t;
    }
    if ((t as unknown as DisposableStore) === this) {
      throw new Error('Cannot register a disposable on itself!');
    }

    if (this._isDisposed) {
      if (!DisposableStore.DISABLE_DISPOSED_WARNING) {
        console.warn(
          new Error(
            'Trying to add a disposable to a DisposableStore that has already been disposed of. The added object will be leaked!',
          ).stack,
        );
      }
    } else {
      this._toDispose.add(t);
    }

    return t;
  }
}

export abstract class Disposable implements IDisposable {
  static readonly None = Object.freeze<IDisposable>({ dispose() {} });

  private readonly _store = new DisposableStore();

  constructor() {
    trackDisposable(this);
  }

  public dispose(): void {
    this._store.dispose();
  }

  protected _register<T extends IDisposable>(t: T): T {
    if ((t as unknown as Disposable) === this) {
      throw new Error('Cannot register a disposable on itself!');
    }
    return this._store.add(t);
  }
}

function trackDisposable<T extends IDisposable>(x: T): T {
  if (!TRACK_DISPOSABLES) {
    return x;
  }

  const stack = new Error('Potentially leaked disposable').stack!;
  setTimeout(() => {
    if (!(x as any)[__is_disposable_tracked__]) {
      console.log(stack);
    }
  }, 3000);
  return x;
}

export class MultiDisposeError extends Error {
  constructor(public readonly errors: any[]) {
    super(
      `Encounter errors while disposing of store. Errors: [${errors.join(', ')}]`,
    );
  }
}

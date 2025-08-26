/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//import { CancellationToken, CancellationTokenSource } from './cancellation.js';
import { BugIndicatingError, CancellationError } from './errors.js';
//import { Emitter, Event } from './event.js';
import {
  Disposable,
  DisposableStore,
  IDisposable,
  toDisposable,
} from './lifecycle.js';
//import { extUri as defaultExxtUri, IExtUri } from './resources.js';
//import { URI } from './uri.js';
//import { setTimeout0 } from './platform.js';
//import { MicrotaskDelay } from './symbols.js';
//import { Lazy } from './lazy.js';

export class TimeoutTimer implements IDisposable {
  private _token: Timeout | undefined;
  private _isDisposed = false;

  constructor();
  constructor(runner: () => void, timeout: number);
  constructor(runner?: () => void, timeout?: number) {
    this._token = undefined;

    if (typeof runner === 'function' && typeof timeout === 'number') {
      this.setIfNotSet(runner, timeout);
    }
  }

  dispose(): void {
    this.cancel();
    this._isDisposed = true;
  }

  cancel(): void {
    if (this._token !== undefined) {
      clearTimeout(this._token);
      this._token = undefined;
    }
  }

  cancelAndSet(runner: () => void, timeout: number): void {
    if (this._isDisposed) {
      throw new BugIndicatingError(
        `Calling 'cancelAndSet' on a disposed TimeoutTimer`,
      );
    }

    this.cancel();
    this._token = setTimeout(() => {
      this._token = undefined;
      runner();
    }, timeout);
  }

  setIfNotSet(runner: () => void, timeout: number): void {
    if (this._isDisposed) {
      throw new BugIndicatingError(
        `Calling 'setIfNotSet' on a disposed TimeoutTimer`,
      );
    }

    if (this._token !== undefined) {
      // timer is already set
      return;
    }
    this._token = setTimeout(() => {
      this._token = undefined;
      runner();
    }, timeout);
  }
}

//#region -- run on idle tricks ------------

export interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining(): number;
}

type IdleApi = Pick<
  typeof globalThis,
  'requestIdleCallback' | 'cancelIdleCallback'
>;

/**
 * Execute the callback the next time the browser is idle, returning an
 * {@link IDisposable} that will cancel the callback when disposed. This wraps
 * [requestIdleCallback] so it will fallback to [setTimeout] if the environment
 * doesn't support it.
 *
 * @param callback The callback to run when idle, this includes an
 * [IdleDeadline] that provides the time alloted for the idle callback by the
 * browser. Not respecting this deadline will result in a degraded user
 * experience.
 * @param timeout A timeout at which point to queue no longer wait for an idle
 * callback but queue it on the regular event loop (like setTimeout). Typically
 * this should not be used.
 *
 * [IdleDeadline]: https://developer.mozilla.org/en-US/docs/Web/API/IdleDeadline
 * [requestIdleCallback]: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
 * [setTimeout]: https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout
 *
 * **Note** that there is `dom.ts#runWhenWindowIdle` which is better suited when running inside a browser
 * context
 */
export let runWhenGlobalIdle: (
  callback: (idle: IdleDeadline) => void,
  timeout?: number,
) => IDisposable;

export let _runWhenIdle: (
  targetWindow: IdleApi,
  callback: (idle: IdleDeadline) => void,
  timeout?: number,
) => IDisposable;

export abstract class AbstractIdleValue<T> {
  private readonly _executor: () => void;
  private readonly _handle: IDisposable;

  private _didRun: boolean = false;
  private _value?: T;
  private _error: unknown;

  constructor(targetWindow: IdleApi, executor: () => T) {
    this._executor = () => {
      try {
        this._value = executor();
      } catch (err) {
        this._error = err;
      } finally {
        this._didRun = true;
      }
    };
    this._handle = _runWhenIdle(targetWindow, () => this._executor());
  }

  dispose(): void {
    this._handle.dispose();
  }

  get value(): T {
    if (!this._didRun) {
      this._handle.dispose();
      this._executor();
    }
    if (this._error) {
      throw this._error;
    }
    return this._value!;
  }

  get isInitialized(): boolean {
    return this._didRun;
  }
}

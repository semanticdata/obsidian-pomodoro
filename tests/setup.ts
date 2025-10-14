/* eslint-disable @typescript-eslint/no-explicit-any */
import { PomodoroTimer } from '../src/logic/timer';
import PomodoroPlugin from '../src/main';

export interface PluginWithPrivates extends PomodoroPlugin {
  _statusBarItem: HTMLElement;
  _timer: PomodoroTimer;
}

jest.mock('obsidian', () => {
  const obsidian = jest.requireActual('obsidian');
  const moment = jest.requireActual('moment');

  return {
    ...obsidian,
    moment
  }
}); // This will use the __mocks__/obsidian.ts automatically

// Mock document.createElement globally to ensure consistent behavior
global.document = {
  createElement: jest.fn().mockImplementation(tagName => {
    const classList = new Set<string>();
    const mockClassList = {
      add: jest.fn((...tokens: string[]) => {
        tokens.forEach(token => classList.add(token));
      }),
      remove: jest.fn((...tokens: string[]) => {
        tokens.forEach(token => classList.delete(token));
      }),
      contains: jest.fn((token: string) => classList.has(token)),
      toggle: jest.fn((token: string, force?: boolean) => {
        const hasToken = classList.has(token);
        if (typeof force !== 'undefined') {
          if (force) classList.add(token);
          else classList.delete(token);
          return force;
        }
        if (hasToken) classList.delete(token);
        else classList.add(token);
        return !hasToken;
      }),
      length: 0,
      value: '',
      toString: jest.fn(() => Array.from(classList).join(' ')),
    };

    Object.defineProperty(mockClassList, 'length', {
      get: () => classList.size
    });

    Object.defineProperty(mockClassList, 'value', {
      get: () => Array.from(classList).join(' ')
    });

    // Create a persistent child element with attribute support so multiple
    // querySelector calls return the same object and tests can inspect attributes.
    const attrs = new Map<string, string>();
    const childEl = {
      textContent: '',
      innerHTML: '',
      getAttribute: jest.fn((k: string) => attrs.has(k) ? attrs.get(k) as string : null),
      setAttribute: jest.fn((k: string, v: any) => { attrs.set(k, String(v)); }),
      removeAttribute: jest.fn((k: string) => { attrs.delete(k); }),
    };

    return {
      tagName,
      classList: mockClassList,
      setText: jest.fn(),
      appendChild: jest.fn(),
      empty: jest.fn(),
      remove: jest.fn(),
      innerHTML: '',
      textContent: '',
      createEl: jest.fn().mockReturnValue({
        textContent: '',
        innerHTML: ''
      }),
      getAttribute: jest.fn((k: string) => attrs.has(k) ? attrs.get(k) as string : null),
      setAttribute: jest.fn((k: string, v: any) => { attrs.set(k, String(v)); }),
      removeAttribute: jest.fn((k: string) => { attrs.delete(k); }),
      querySelector: jest.fn().mockImplementation(() => childEl),
      addEventListener: jest.fn() as jest.Mock,
      style: { display: '' },
      
    };
  }),
} as Document & { createElement: jest.Mock };

/**
 * Timer Mocking Strategy:
 * We rely on Jest's built-in fake timers (jest.useFakeTimers()) instead of
 * custom mocks. This allows tests to properly advance time and execute callbacks.
 *
 * Tests that need timer functionality should:
 * 1. Call jest.useFakeTimers() in beforeEach or at test start
 * 2. Use jest.advanceTimersByTime(ms) to advance time
 * 3. Call jest.useRealTimers() in afterEach or at test end
 */

interface MockMouseEventOptions {
  button?: number;
}

// Mock MouseEvent for DOM interaction tests
(global as typeof globalThis).MouseEvent = class MockMouseEvent {
  type: string;
  button: number;
  preventDefault: jest.Mock;

  constructor(type: string, options: MockMouseEventOptions = {}) {
    this.type = type;
    this.button = options.button || 0;
    this.preventDefault = jest.fn();
  }
} as unknown as typeof MouseEvent;

if (!global.alert) {
  global.alert = jest.fn();
}
// Ensure window.alert is also mocked as the plugin might use it directly
if (global.window && !global.window.alert) {
  global.window.alert = jest.fn();
}

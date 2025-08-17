import { PomodoroTimer } from '../src/logic/timer';
import PomodoroPlugin from '../src/main';

export interface PluginWithPrivates extends PomodoroPlugin {
  _statusBarItem: HTMLElement;
  _timer: PomodoroTimer;
}

jest.mock('obsidian'); // This will use the __mocks__/obsidian.ts automatically

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
      querySelector: jest.fn().mockReturnValue({
        textContent: '',
        innerHTML: ''
      }),
      addEventListener: jest.fn() as jest.Mock,
      style: { display: '' },
      removeAttribute: jest.fn(),
      setAttribute: jest.fn(),
    };
  }),
} as Document & { createElement: jest.Mock };

// Mock the global window object for setInterval/clearInterval 
// Use fake timers instead of real ones to prevent hanging
let mockIntervalCounter = 1;
const activeIntervals = new Map<number, NodeJS.Timeout>();

export const mockSetInterval = jest.fn().mockImplementation((callback: TimerHandler, delay?: number, ...args: unknown[]) => {
  const id = mockIntervalCounter++;
  // Don't actually set real intervals in tests - just return an ID
  // Real timer behavior should be tested differently
  return id;
});

export const mockClearInterval = jest.fn().mockImplementation((id: number) => {
  // Clear from our tracking
  const timeout = activeIntervals.get(id);
  if (timeout) {
    clearTimeout(timeout);
    activeIntervals.delete(id);
  }
});

interface MockMouseEventOptions {
  button?: number;
}

// Mock MouseEvent
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

if (!global.window) {
  Object.defineProperty(global, 'window', {
    value: {
      setInterval: mockSetInterval,
      clearInterval: mockClearInterval,
      // Add other window properties your plugin might use
    },
    writable: true,
  });
} else {
  // If window exists but we still want to mock these functions
  window.setInterval = mockSetInterval as typeof window.setInterval;
  window.clearInterval = mockClearInterval as typeof window.clearInterval;
}

// Properly type the mocks for TypeScript
declare global {
  interface Window {
    setInterval: typeof mockSetInterval;
    clearInterval: typeof mockClearInterval;
  }
}

if (!global.alert) {
  global.alert = jest.fn();
}
// Ensure window.alert is also mocked as the plugin might use it directly
if (global.window && !global.window.alert) {
  global.window.alert = jest.fn();
}

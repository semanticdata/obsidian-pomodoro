import { jest } from '@jest/globals';

export class Plugin {
  app: App;
  manifest: any;
  statusBarItem: HTMLElement | null = null;

  constructor(app: App, manifest: any) {
    this.app = app;
    this.manifest = manifest;
  }

  addStatusBarItem(): HTMLElement {
    // Create a more complete mock element that includes our custom properties
    const item = document.createElement('div');

    // Add the setText method with proper typing
    (item as any).setText = jest.fn();

    // Create a proper mock for classList that implements DOMTokenList
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
      item: jest.fn((index: number) => Array.from(classList)[index] || null),
      length: 0, // Will be updated via getter
      value: '', // Will be updated via getter
      toString: jest.fn(() => Array.from(classList).join(' ')),
      replace: jest.fn((oldToken: string, newToken: string) => {
        if (classList.has(oldToken)) {
          classList.delete(oldToken);
          classList.add(newToken);
          return true;
        }
        return false;
      }),
      supports: jest.fn((token: string) => true),
      entries: jest.fn(() => Array.from(classList.entries())),
      forEach: jest.fn((callback: (value: string, key: number, parent: any) => void) => {
        Array.from(classList).forEach((value, index) => callback(value, index, mockClassList));
      }),
      keys: jest.fn(() => Array.from(classList.keys())),
      values: jest.fn(() => Array.from(classList.values())),
      [Symbol.iterator]: jest.fn(function* () {
        yield* classList;
      })
    };

    // Add getters for length and value
    Object.defineProperty(mockClassList, 'length', {
      get: () => classList.size
    });

    Object.defineProperty(mockClassList, 'value', {
      get: () => Array.from(classList).join(' ')
    });

    Object.defineProperty(item, 'classList', {
      value: mockClassList,
      configurable: true
    });
    // this.statusBarItem = item; // PomodoroPlugin will set its own instance member
    return item;
  }

  registerDomEvent = jest.fn((el: HTMLElement, event: string, callback: (...args: any[]) => any) => {
    // Mock implementation that stores the calls for testing
  })

  registerInterval(intervalId: number) {
    // Mock implementation or leave empty
  }

  async loadData() {
    return Promise.resolve({});
  }

  async saveData(data: any) {
    return Promise.resolve();
  }

  addSettingTab(settingTab: PluginSettingTab) {
    // Mock implementation
  }

  onunload() {
    // Mock implementation
    if (this.statusBarItem) {
      this.statusBarItem.remove();
    }
  }
}

export class PluginSettingTab {
  app: App;
  plugin: Plugin;
  containerEl: HTMLElement;

  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = document.createElement('div');
  }

  display(): void {
    // Mock implementation
  }
}

export class Setting {
  settingEl: HTMLElement;
  constructor(containerEl: HTMLElement) {
    this.settingEl = document.createElement('div');
    containerEl.appendChild(this.settingEl);
  }
  setName(name: string) { return this; }
  setDesc(desc: string) { return this; }
  addText(cb: (textComponent: any) => any) {
    // Mock text component for chaining
    const mockText = {
      setPlaceholder: jest.fn().mockReturnThis(),
      setValue: jest.fn().mockReturnThis(),
      onChange: jest.fn().mockReturnThis(),
      inputEl: document.createElement('input'),
    };
    cb(mockText);
    return this;
  }
}

export interface App {
  // Define minimal App properties/methods your plugin uses or mock them as needed
}

// Mock for document if running in Node without JSDOM (basic)
if (typeof document === 'undefined') {
  global.document = {
    createElement: (tagName: string) => ({
      tagName,
      classList: { add: jest.fn(), remove: jest.fn() },
      setText: jest.fn(), // if your mock needs it
      appendChild: jest.fn(),
      empty: jest.fn(),
      remove: jest.fn(),
      // Add other properties/methods your code might use on elements
    }),
    // Add other document properties/methods if needed
  } as any;
}

if (typeof window === 'undefined') {
  let intervalId = 1;
  global.window = {
    setInterval: jest.fn().mockImplementation(() => {
      return intervalId++;
    }),
    clearInterval: jest.fn(),
    // Add other window properties if needed
  } as any;
  global.alert = jest.fn();
}
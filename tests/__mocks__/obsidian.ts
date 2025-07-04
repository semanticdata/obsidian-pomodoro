import { jest } from '@jest/globals';

interface PluginManifest {
  id: string;
  name: string;
  version: string;
  minAppVersion: string;
  description: string;
  author: string;
}

export class Plugin {
  app: App;
  manifest: PluginManifest;
  statusBarItem: HTMLElement | null = null;

  constructor(app: App, manifest: PluginManifest) {
    this.app = app;
    this.manifest = manifest;
  }

  addStatusBarItem(): HTMLElement {
    // Create a more complete mock element that includes our custom properties
    const item = document.createElement('div');

    // Add the setText method with proper typing
    (item as unknown as HTMLElement & { setText: jest.Mock }).setText = jest.fn();

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
      forEach: jest.fn((callback: (value: string, key: number, parent: DOMTokenList) => void) => {
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

    // Track child elements for querySelector
    const childElements: HTMLElement[] = [];
    
    // Add appendChild and other DOM methods
    Object.defineProperty(item, 'appendChild', {
      value: jest.fn((child: HTMLElement) => {
        childElements.push(child);
        return child;
      }),
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(item, 'querySelector', {
      value: jest.fn((selector: string) => {
        // Simple mock querySelector for our specific needs
        if (selector === '.pomodoro-icon') {
          const iconEl = childElements.find(el => el.classList?.contains('pomodoro-icon'));
          if (iconEl) return iconEl;
          // Return a mock icon element if not found
          return {
            style: { display: '' },
            removeAttribute: jest.fn(),
            setAttribute: jest.fn(),
            classList: { contains: jest.fn(() => true) }
          };
        }
        if (selector === '.pomodoro-text') {
          const textEl = childElements.find(el => el.classList?.contains('pomodoro-text'));
          if (textEl) return textEl;
          // Return a mock text element if not found
          return {
            textContent: '',
            innerHTML: ''
          };
        }
        return null;
      }),
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(item, 'addEventListener', {
      value: jest.fn(),
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(item, 'innerHTML', {
      value: '',
      writable: true,
      configurable: true
    });

    // this.statusBarItem = item; // PomodoroPlugin will set its own instance member
    return item;
  }

  registerDomEvent = jest.fn((el: HTMLElement, event: string, callback: (event: Event) => void) => {
    // Mock implementation that stores the calls for testing
  })

  registerInterval(intervalId: number) {
    // Mock implementation or leave empty
  }

  async loadData() {
    return Promise.resolve({});
  }

  async saveData(data: Record<string, unknown>) {
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
  private onChangeCallback?: (value: string) => Promise<void>;

  constructor(containerEl: HTMLElement) {
    this.settingEl = document.createElement('div');
    containerEl.appendChild(this.settingEl);
  }

  setName(name: string) { return this; }
  setDesc(desc: string) { return this; }

  addText(cb: (textComponent: TextComponent) => TextComponent) {
    // Mock text component for chaining
    const mockText: TextComponent = {
      setPlaceholder: jest.fn().mockReturnThis(),
      setValue: jest.fn().mockReturnThis(),
      onChange: jest.fn((callback: (value: string) => Promise<void>) => {
        this.onChangeCallback = callback;
        return mockText;
      }),
      inputEl: document.createElement('input'),
      // Add method to simulate user input for testing
      simulateInput: async (value: string) => {
        if (this.onChangeCallback) {
          await this.onChangeCallback(value);
        }
      }
    };
    cb(mockText);
    return this;
  }

  // Method to get the text component for testing
  getTextComponent() {
    return this.settingEl.querySelector('input');
  }
}

export interface App {
  workspace?: unknown;
  vault?: unknown;
}

interface TextComponent {
  setPlaceholder: jest.Mock;
  setValue: jest.Mock;
  onChange: jest.Mock;
  inputEl: HTMLInputElement;
  simulateInput?: (value: string) => Promise<void>;
}

// Mock for document if running in Node without JSDOM (basic)
if (typeof document === 'undefined') {
  global.document = {
    createElement: (tagName: string) => ({
      tagName,
      classList: { 
        add: jest.fn(), 
        remove: jest.fn(),
        contains: jest.fn(() => false)
      },
      setText: jest.fn(), // if your mock needs it
      appendChild: jest.fn(),
      empty: jest.fn(),
      remove: jest.fn(),
      addEventListener: jest.fn(),
      innerHTML: '',
      textContent: '',
      style: { display: '' },
      removeAttribute: jest.fn(),
      setAttribute: jest.fn(),
      // Add other properties/methods your code might use on elements
    }),
    // Add other document properties/methods if needed
  } as Document & { createElement: (tagName: string) => Partial<HTMLElement> };
}

if (typeof window === 'undefined') {
  let intervalId = 1;
  const mockWindow = {
    setInterval: jest.fn().mockImplementation(() => {
      return intervalId++;
    }),
    clearInterval: jest.fn(),
    alert: jest.fn(),
    // Add other window properties if needed
  };
  Object.assign(global, { window: mockWindow });
  global.alert = jest.fn();
}
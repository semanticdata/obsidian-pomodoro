// __mocks__/obsidian.ts
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
    const item = document.createElement('div') as HTMLElement & { setText: jest.Mock, classList: { add: jest.Mock, remove: jest.Mock } }; // Cast to add setText and classList mocks
    item.setText = jest.fn(); // Add mock setText method
    item.classList = { // Mock classList with add and remove
      add: jest.fn(),
      remove: jest.fn()
    };
    // this.statusBarItem = item; // PomodoroPlugin will set its own instance member
    return item;
  }

  registerDomEvent(el: HTMLElement, event: string, callback: (...args: any[]) => any) {
    // Mock implementation or leave empty if not critical for tests
  }

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
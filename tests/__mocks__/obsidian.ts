import { jest } from '@jest/globals';

function createMockTextComponent() {
	let onChangeCallback: ((value: string) => void) | null = null;

	const component: any = {
		setPlaceholder: jest.fn().mockReturnThis(),
		setValue: jest.fn().mockReturnThis(),
		onChange: jest.fn((cb: (value: string) => void) => {
			onChangeCallback = cb;
			return component;
		}),
		onInput: jest.fn().mockReturnThis(),
		// Helper method to trigger the onChange callback in tests
		triggerChange: async (value: string) => {
			if (onChangeCallback) {
				await onChangeCallback(value);
			}
		},
	};

	return component;
}

function createMockToggleComponent() {
	let onChangeCallback: ((value: boolean) => void) | null = null;

	const component: any = {
		setValue: jest.fn().mockReturnThis(),
		onChange: jest.fn((cb: (value: boolean) => void) => {
			onChangeCallback = cb;
			return component;
		}),
		triggerChange: async (value: boolean) => {
			if (onChangeCallback) {
				await onChangeCallback(value);
			}
		},
	};

	return component;
}

function createMockDropdownComponent() {
	let onChangeCallback: ((value: string) => void) | null = null;

	const component: any = {
		addOption: jest.fn().mockReturnThis(),
		setValue: jest.fn().mockReturnThis(),
		onChange: jest.fn((cb: (value: string) => void) => {
			onChangeCallback = cb;
			return component;
		}),
		triggerChange: async (value: string) => {
			if (onChangeCallback) {
				await onChangeCallback(value);
			}
		},
	};

	return component;
}

function createMockSliderComponent() {
	let onChangeCallback: ((value: number) => void) | null = null;

	const component: any = {
		setLimits: jest.fn().mockReturnThis(),
		setValue: jest.fn().mockReturnThis(),
		setDynamicTooltip: jest.fn().mockReturnThis(),
		onChange: jest.fn((cb: (value: number) => void) => {
			onChangeCallback = cb;
			return component;
		}),
		triggerChange: async (value: number) => {
			if (onChangeCallback) {
				await onChangeCallback(value);
			}
		},
	};

	return component;
}

function createMockButtonComponent() {
	let onClickCallback: (() => void) | null = null;

	const component: any = {
		setButtonText: jest.fn().mockReturnThis(),
		onClick: jest.fn((cb: () => void) => {
			onClickCallback = cb;
			return component;
		}),
		triggerClick: () => {
			if (onClickCallback) {
				onClickCallback();
			}
		},
	};

	return component;
}

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
  domEventHandlers: { el: HTMLElement, event: string, callback: (event: Event) => void }[] = [];

  constructor(app: App, manifest: PluginManifest) {
    this.app = app;
    this.manifest = manifest;
  }

  addStatusBarItem(): HTMLElement {
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

    // Track child elements for querySelector
    const childElements: HTMLElement[] = [];

    // Create a complete mock element
    const item = {
      tagName: 'DIV',
      classList: mockClassList,
      setText: jest.fn(),
      appendChild: jest.fn((child: HTMLElement) => {
        childElements.push(child);
        return child;
      }),
      querySelector: jest.fn((selector: string) => {
        // Simple mock querySelector for our specific needs
        if (selector === '.pomodoro-icon') {
          const iconEl = childElements.find(el => el.classList && typeof el.classList.contains === 'function' && el.classList.contains('pomodoro-icon'));
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
          const textEl = childElements.find(el => el.classList && typeof el.classList.contains === 'function' && el.classList.contains('pomodoro-text'));
          if (textEl) return textEl;
          // Return a mock text element if not found
          return {
            textContent: '',
            innerHTML: ''
          };
        }
        return null;
      }),
      addEventListener: jest.fn(),
      innerHTML: '',
      textContent: '',
      style: { display: '' },
      removeAttribute: jest.fn(),
      setAttribute: jest.fn(),
      remove: jest.fn(),
    };

    // this.statusBarItem = item; // PomodoroPlugin will set its own instance member
    return item as unknown as HTMLElement;
  }

  registerDomEvent = jest.fn((el: HTMLElement, event: string, callback: (event: Event) => void) => {
    console.log('registerDomEvent called:', event);
    (this as any).domEventHandlers.push({ el, event, callback });
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

  addCommand = jest.fn((command: { id: string; name: string; callback: () => void }) => {
    // Mock implementation that stores the command
    return command;
  })

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

export const Setting = jest.fn().mockImplementation(() => {
  const settingInstance: any = {};

  // simple settingEl
  settingInstance.settingEl = { style: { display: "" } };

  // Fluent API methods - always return the same mock instance
  settingInstance.setName = jest.fn(() => settingInstance);
  settingInstance.setDesc = jest.fn(() => settingInstance);
  settingInstance.setHeading = jest.fn(() => settingInstance);

  settingInstance.addText = jest.fn((cb: any) => {
    const component = createMockTextComponent();
    cb(component);
    return settingInstance;
  });

  settingInstance.addToggle = jest.fn((cb: any) => {
    const component = createMockToggleComponent();
    cb(component);
    return settingInstance;
  });

  settingInstance.addDropdown = jest.fn((cb: any) => {
    const component = createMockDropdownComponent();
    cb(component);
    return settingInstance;
  });

  settingInstance.addSlider = jest.fn((cb: any) => {
    const component = createMockSliderComponent();
    cb(component);
    return settingInstance;
  });

  settingInstance.addButton = jest.fn((cb: any) => {
    const component = createMockButtonComponent();
    cb(component);
    return settingInstance;
  });

  return settingInstance;
});

export interface App {
  workspace?: unknown;
  vault?: unknown;
}

type OnChangeCallback = (value: string) => Promise<void>;
type OnChangeFunc = (callback: OnChangeCallback) => TextComponent;

interface TextComponent {
  setPlaceholder: jest.Mock;
  setValue: jest.Mock;
  onChange: jest.Mock<OnChangeFunc>;
  inputEl: HTMLInputElement;
  simulateInput?: (value: string) => Promise<void>;
}

interface ToggleComponent {
  setValue: jest.Mock;
  onChange: jest.Mock;
}

interface DropdownComponent {
  addOption: jest.Mock;
  setValue: jest.Mock;
  onChange: jest.Mock;
}

interface SliderComponent {
  setLimits: jest.Mock;
  setValue: jest.Mock;
  setDynamicTooltip: jest.Mock;
  onChange: jest.Mock;
}

interface ButtonComponent {
  setButtonText: jest.Mock;
  onClick: jest.Mock;
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

export class Notice {
  message: string;
  timeout?: number;

  constructor(message: string, timeout?: number) {
    this.message = message;
    this.timeout = timeout;
  }

  hide() {
    // Mock implementation
  }
}
import PomodoroPlugin from '../src/plugin';
import { App } from 'obsidian';
import { PomodoroTimer } from '../src/timer';

interface PluginWithPrivates extends PomodoroPlugin {
  _statusBarItem: HTMLElement;
  _timer: PomodoroTimer;
}

jest.mock('obsidian'); // This will use the __mocks__/obsidian.ts automatically

// Mock the global window object for setInterval/clearInterval if not already handled by JSDOM or similar
const mockSetInterval = jest.fn().mockImplementation((callback: TimerHandler, delay?: number, ...args: unknown[]) => {
  return Number(setTimeout(callback as TimerHandler, delay, ...args));
});

const mockClearInterval = jest.fn().mockImplementation((id: number) => {
  clearTimeout(id);
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

// Cast the mocks to jest.Mock for testing
// const mockSetIntervalFn = window.setInterval as unknown as jest.Mock<number, [TimerHandler, (number | undefined)?, ...unknown[]]>;
if (!global.alert) {
  global.alert = jest.fn();
}
// Ensure window.alert is also mocked as the plugin might use it directly
if (global.window && !global.window.alert) {
  global.window.alert = jest.fn();
}
if (!global.document) { // Basic document mock if not present (e.g. Node environment)
  global.document = {
    createElement: jest.fn().mockImplementation(tagName => ({
      tagName,
      classList: { add: jest.fn(), remove: jest.fn() },
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
      addEventListener: jest.fn(),
      // Add other properties/methods your code might use on elements
    })),
    // Add other document properties/methods if needed
  } as Document & { createElement: jest.Mock };
}


describe('PomodoroPlugin', () => {
  let plugin: PomodoroPlugin;
  let mockApp: App;
  let mockStatusBarItem: HTMLElement; // Will be set by the mocked Plugin's addStatusBarItem

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    mockApp = {} as App; // Minimal App mock
    const manifest = { id: 'test-plugin', name: 'Test Plugin', version: '1.0.0', minAppVersion: '0.15.0', author: 'Test Author', description: 'Test Description' };

    plugin = new PomodoroPlugin(mockApp, manifest);

    // The mocked 'obsidian' module's Plugin class will provide mocks for these:
    // addStatusBarItem, registerDomEvent, registerInterval, loadData, saveData
    // We might need to spy on them if we want to check if they were called with specific args.
    // For loadData, we can re-mock it per test if specific return values are needed.
    plugin.loadData = jest.fn().mockResolvedValue({});
    plugin.saveData = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(async () => {
    // Ensure plugin is unloaded if onload was called
    if (plugin.onunload) {
      await plugin.onunload();
    }
  });

  describe('Initialization and Settings', () => {
    it('should load default settings on onload if no saved data', async () => {
      await plugin.onload();
      expect(plugin.settings.workTime).toBe(25);
      expect(plugin.settings.shortBreakTime).toBe(5);
      expect(plugin.settings.longBreakTime).toBe(15);
      expect(plugin.settings.intervalsBeforeLongBreak).toBe(4);
      expect((plugin as PluginWithPrivates)._statusBarItem).toBeDefined();
      mockStatusBarItem = (plugin as PluginWithPrivates)._statusBarItem;
    });

    it('should load saved settings on onload', async () => {
      const savedSettings = {
        workTime: 30,
        shortBreakTime: 7,
        longBreakTime: 20,
        intervalsBeforeLongBreak: 3,
      };
      plugin.loadData = jest.fn().mockResolvedValue(savedSettings);
      await plugin.onload();
      expect(plugin.settings).toEqual(savedSettings);
    });
  });

  describe('Timer Logic', () => {
    beforeEach(async () => {
      await plugin.onload();
      mockStatusBarItem = (plugin as PluginWithPrivates)._statusBarItem;
    });

    it('should start the timer and update display', () => {
      jest.useFakeTimers();
      const timer = (plugin as PluginWithPrivates)._timer;
      
      timer.startTimer();
      expect(timer.running).toBe(true);
      expect(mockStatusBarItem.classList.add).toHaveBeenCalledWith('active');
      expect(mockStatusBarItem.classList.remove).toHaveBeenCalledWith('paused');
      expect(window.setInterval).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });

    it('should pause the timer', async () => {
      await plugin.onload();
      const timer = (plugin as PluginWithPrivates)._timer;
      mockStatusBarItem = (plugin as PluginWithPrivates)._statusBarItem;
      
      // Clear previous classList calls from setup
      (mockStatusBarItem.classList.add as jest.Mock).mockClear();
      (mockStatusBarItem.classList.remove as jest.Mock).mockClear();
      
      timer.startTimer();
      timer.pauseTimer();
      expect(timer.running).toBe(false);
      expect(mockStatusBarItem.classList.remove).toHaveBeenCalledWith('active');
      expect(mockStatusBarItem.classList.add).toHaveBeenCalledWith('paused');
      expect(window.clearInterval).toHaveBeenCalledTimes(1);
    });

    it('should reset the timer', async () => {
      await plugin.onload();
      const timer = (plugin as PluginWithPrivates)._timer;
      
      timer.resetTimer();
      expect(timer.running).toBe(false);
      expect(timer.timeRemaining).toBe(plugin.settings.workTime * 60);
    });

    it('should cycle durations correctly', async () => {
      await plugin.onload();
      const timer = (plugin as PluginWithPrivates)._timer;
      
      timer.cycleDuration();
      expect(timer.currentDuration).toBe(1); // Short break
      
      timer.cycleDuration();
      expect(timer.currentDuration).toBe(2); // Long break
      
      timer.cycleDuration();
      expect(timer.currentDuration).toBe(0); // Work
    });
  });

  describe('Settings Management', () => {
    beforeEach(async () => {
      await plugin.onload();
    });

    it('should save settings', async () => {
      plugin.settings.workTime = 30;
      await plugin.saveSettings();
      expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
    });

    it('should update timer settings when settings change', async () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      const updateSettingsSpy = jest.spyOn(timer, 'updateSettings');
      
      plugin.settings.workTime = 45;
      await plugin.saveSettings();
      
      expect(updateSettingsSpy).toHaveBeenCalledWith(plugin.settings);
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should add settings tab on load', async () => {
      const addSettingTabSpy = jest.spyOn(plugin, 'addSettingTab');
      await plugin.onload();
      expect(addSettingTabSpy).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should initialize with correct default state', async () => {
      await plugin.onload();
      const timer = (plugin as PluginWithPrivates)._timer;
      expect(timer.timeRemaining).toBe(plugin.settings.workTime * 60);
      expect(timer.running).toBe(false);
      expect(timer.currentDuration).toBe(0);
      expect(timer.workCount).toBe(0);
    });
  });

  describe('Compatibility Properties', () => {
    beforeEach(async () => {
      await plugin.onload();
    });

    it('should provide currentDurationIndex getter', () => {
      expect(plugin.currentDurationIndex).toBe(0);
    });

    it('should provide workIntervalCount getter', () => {
      expect(plugin.workIntervalCount).toBe(0);
    });

    it('should provide resetTimer method', () => {
      expect(typeof plugin.resetTimer).toBe('function');
      plugin.resetTimer();
      // Should not throw
    });
  });

  describe('Icon Integration', () => {
    it('should include timer icon in status bar', async () => {
      const createElementSpy = jest.spyOn(document, 'createElement');
      await plugin.onload();
      const statusBar = (plugin as PluginWithPrivates)._statusBarItem;
      // Check that appendChild was called (icon container was added)
      expect(statusBar.appendChild).toHaveBeenCalled();
      // Since the icon is added to a child element, we can check that document.createElement was called for spans
      expect(createElementSpy).toHaveBeenCalledWith('span');
      createElementSpy.mockRestore();
    });
  });
});
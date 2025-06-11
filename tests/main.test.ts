import PomodoroPlugin from '../main';
import { App, Plugin } from 'obsidian';

// Mock Obsidian's Plugin class and other UI elements
const mockApp = {} as App;

jest.mock('obsidian'); // This will use the __mocks__/obsidian.ts automatically

// Mock the global window object for setInterval/clearInterval if not already handled by JSDOM or similar
const mockSetInterval = jest.fn().mockImplementation((callback: TimerHandler, delay?: number, ...args: any[]) => {
  return Number(setTimeout(callback as any, delay, ...args));
});

const mockClearInterval = jest.fn().mockImplementation((id: number) => {
  clearTimeout(id);
});

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
  window.setInterval = mockSetInterval as any;
  window.clearInterval = mockClearInterval as any;
}

// Properly type the mocks for TypeScript
declare global {
  interface Window {
    setInterval: typeof mockSetInterval;
    clearInterval: typeof mockClearInterval;
  }
}

// Cast the mocks to jest.Mock for testing
const mockSetIntervalFn = window.setInterval as unknown as jest.Mock<number, [TimerHandler, (number | undefined)?, ...any[]]>;
const mockClearIntervalFn = window.clearInterval as unknown as jest.Mock<void, [number | undefined]>;
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
      // Add other properties/methods your code might use on elements
    })),
    // Add other document properties/methods if needed
  } as any;
}


describe('PomodoroPlugin', () => {
  let plugin: PomodoroPlugin;
  let mockApp: App;
  let mockStatusBarItem: any; // Will be set by the mocked Plugin's addStatusBarItem

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
    plugin.loadData = jest.fn().mockResolvedValue({}); // Default to empty settings
    plugin.saveData = jest.fn().mockResolvedValue(undefined);

    // Capture the statusBarItem created by the plugin's onload (via mocked addStatusBarItem)
    // This requires addStatusBarItem in the mock to actually create and return a mock item.
    // The current __mocks__/obsidian.ts does this.
    // We'll access plugin.statusBarItem directly after onload.
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
      // expect(plugin.addStatusBarItem).toHaveBeenCalled(); // This is part of the mocked Plugin class
      expect(plugin.statusBarItem).toBeDefined();
      mockStatusBarItem = plugin.statusBarItem; // Capture for later assertions
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
      // Ensure onload is called to initialize the plugin and status bar
      await plugin.onload();
      // Reset timer to default work time before each timer logic test
      plugin.currentDurationIndex = 0; // Work
      plugin.workIntervalCount = 0;
      plugin.resetTimer();
      // Ensure statusBarItem is the one created by the plugin
      mockStatusBarItem = plugin.statusBarItem;
      // Clear mocks on the captured statusBarItem if it has jest.fn properties
      if (mockStatusBarItem && mockStatusBarItem.setText && mockStatusBarItem.setText.mockClear) {
        mockStatusBarItem.setText.mockClear();
      }
      if (mockStatusBarItem && mockStatusBarItem.classList && mockStatusBarItem.classList.add && mockStatusBarItem.classList.add.mockClear) {
        mockStatusBarItem.classList.add.mockClear();
      }
      if (mockStatusBarItem && mockStatusBarItem.classList && mockStatusBarItem.classList.remove && mockStatusBarItem.classList.remove.mockClear) {
        mockStatusBarItem.classList.remove.mockClear();
      }
    });


    it('should start the timer, update display, and decrement remainingTime', () => {
      jest.useFakeTimers();
      plugin.startTimer();
      expect(plugin.isRunning).toBe(true);
      expect(mockStatusBarItem.classList.add).toHaveBeenCalledWith('active');
      expect(mockStatusBarItem.classList.remove).toHaveBeenCalledWith('paused');
      expect(window.setInterval).toHaveBeenCalledTimes(1);
      expect(window.setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);

      // Simulate time passing
      const initialTime = plugin.settings.workTime * 60;
      expect(plugin.remainingTime).toBe(initialTime);

      // Get the callback function from the setInterval call
      const timerCallback = (window.setInterval as jest.Mock).mock.calls[0][0];

      // Manually execute the callback to simulate 1 second passing
      timerCallback();
      expect(plugin.remainingTime).toBe(initialTime - 1);
      expect(mockStatusBarItem.setText).toHaveBeenCalledWith(`24:59`);

      // Execute callback 59 more times to simulate 1 minute total
      for (let i = 0; i < 59; i++) {
        timerCallback();
      }
      expect(plugin.remainingTime).toBe(initialTime - 60);
      expect(mockStatusBarItem.setText).toHaveBeenCalledWith(`24:00`);
      jest.useRealTimers();
    });

    it('should pause the timer', () => {
      plugin.startTimer(); // Start it first
      plugin.pauseTimer();
      expect(plugin.isRunning).toBe(false);
      expect(mockStatusBarItem.classList.remove).toHaveBeenCalledWith('active');
      expect(mockStatusBarItem.classList.add).toHaveBeenCalledWith('paused');
      expect(window.clearInterval).toHaveBeenCalledTimes(1);
    });

    it('should reset the timer to work duration', () => {
      plugin.startTimer();
      plugin.remainingTime = 100;
      plugin.resetTimer();
      expect(plugin.isRunning).toBe(false);
      expect(plugin.remainingTime).toBe(plugin.settings.workTime * 60);
      expect(mockStatusBarItem.setText).toHaveBeenCalledWith(`${String(plugin.settings.workTime).padStart(2, '0')}:00`);
      expect(mockStatusBarItem.classList.remove).toHaveBeenCalledWith('active');
      expect(mockStatusBarItem.classList.remove).toHaveBeenCalledWith('paused');
    });

    it('should cycle to short break after work timer finishes', () => {
      jest.useFakeTimers();
      plugin.startTimer(); // Starts work timer
      expect(plugin.currentDurationIndex).toBe(0); // Work

      // Get the timer callback and simulate the timer finishing
      const timerCallback = (window.setInterval as jest.Mock).mock.calls[0][0];

      // Execute callback enough times to finish the work timer
      // We need to execute it exactly workTimeSeconds times to trigger completion
      const workTimeSeconds = plugin.settings.workTime * 60;
      for (let i = 0; i < workTimeSeconds; i++) {
        timerCallback();
      }
      // Execute one more time to trigger the completion logic when remainingTime becomes 0
      timerCallback();

      expect(global.alert).toHaveBeenCalledWith("PomoBar: Time's up! Your most recent timer has finished.");
      expect(plugin.isRunning).toBe(false); // Timer should be paused
      expect(plugin.currentDurationIndex).toBe(1); // Should be short break
      expect(plugin.remainingTime).toBe(plugin.settings.shortBreakTime * 60);
      expect(plugin.workIntervalCount).toBe(1);
      jest.useRealTimers();
    });

    it('should cycle to long break after specified work intervals', () => {
      jest.useFakeTimers();
      plugin.settings.intervalsBeforeLongBreak = 2; // For easier testing
      plugin.workIntervalCount = 0;
      plugin.currentDurationIndex = 0; // Start with work
      plugin.resetTimer();

      // Cycle 1: Work -> Short Break
      plugin.startTimer();
      let timerCallback = mockSetIntervalFn.mock.calls[0][0] as () => void;
      // Execute work timer to completion
      for (let i = 0; i < plugin.settings.workTime * 60; i++) {
        timerCallback();
      }
      timerCallback(); // Execute one more time to trigger completion
      expect(plugin.currentDurationIndex).toBe(1); // Short Break
      expect(plugin.workIntervalCount).toBe(1);

      // Cycle 1: Short Break -> Work
      plugin.startTimer(); // Starts short break timer
      timerCallback = mockSetIntervalFn.mock.calls[1][0] as () => void;
      // Execute short break timer to completion
      for (let i = 0; i < plugin.settings.shortBreakTime * 60; i++) {
        timerCallback();
      }
      timerCallback(); // Execute one more time to trigger completion
      expect(plugin.currentDurationIndex).toBe(0); // Work

      // Cycle 2: Work -> Long Break (because intervalsBeforeLongBreak is 2)
      plugin.startTimer(); // Starts work timer
      timerCallback = mockSetIntervalFn.mock.calls[2][0] as () => void;
      // Execute work timer to completion
      for (let i = 0; i < plugin.settings.workTime * 60; i++) {
        timerCallback();
      }
      timerCallback(); // Execute one more time to trigger completion
      expect(plugin.currentDurationIndex).toBe(2); // Long Break
      expect(plugin.workIntervalCount).toBe(0); // Reset for next cycle
      expect(plugin.remainingTime).toBe(plugin.settings.longBreakTime * 60);
      jest.useRealTimers();
    });

    it('should cycle durations correctly with middle click when not running', () => {
      plugin.pauseTimer(); // Ensure timer is not running
      plugin.currentDurationIndex = 0; // Start at Work
      plugin.resetTimer();

      plugin.cycleDuration(); // Work -> Short Break
      expect(plugin.currentDurationIndex).toBe(1);
      expect(plugin.remainingTime).toBe(plugin.settings.shortBreakTime * 60);

      plugin.cycleDuration(); // Short Break -> Long Break
      expect(plugin.currentDurationIndex).toBe(2);
      expect(plugin.remainingTime).toBe(plugin.settings.longBreakTime * 60);

      plugin.cycleDuration(); // Long Break -> Work
      expect(plugin.currentDurationIndex).toBe(0);
      expect(plugin.remainingTime).toBe(plugin.settings.workTime * 60);
      expect(plugin.workIntervalCount).toBe(0); // Should be reset
    });

    it('should not cycle duration if timer is running', () => {
      plugin.startTimer();
      const initialDurationIndex = plugin.currentDurationIndex;
      const initialRemainingTime = plugin.remainingTime;
      plugin.cycleDuration();
      expect(plugin.currentDurationIndex).toBe(initialDurationIndex);
      expect(plugin.remainingTime).toBe(initialRemainingTime);
    });
  });
});
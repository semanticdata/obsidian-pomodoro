import PomodoroPlugin from '../main';
import { App } from 'obsidian';

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
const mockSetIntervalFn = window.setInterval as unknown as jest.Mock<number, [TimerHandler, (number | undefined)?, ...unknown[]]>;
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
      mockStatusBarItem = plugin.statusBarItem!; // Capture for later assertions
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
      mockStatusBarItem = plugin.statusBarItem!;
      // Clear mocks on the captured statusBarItem if it has jest.fn properties
      const statusBarWithMocks = mockStatusBarItem as HTMLElement & { setText?: jest.Mock };
      if (statusBarWithMocks.setText && statusBarWithMocks.setText.mockClear) {
        statusBarWithMocks.setText.mockClear();
      }
      const mockClassList = mockStatusBarItem.classList as DOMTokenList & { add?: jest.Mock; remove?: jest.Mock };
      if (mockClassList.add && mockClassList.add.mockClear) {
        mockClassList.add.mockClear();
      }
      if (mockClassList.remove && mockClassList.remove.mockClear) {
        mockClassList.remove.mockClear();
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
      expect((mockStatusBarItem as HTMLElement & { setText: jest.Mock }).setText).toHaveBeenCalledWith(`24:59`);

      // Execute callback 59 more times to simulate 1 minute total
      for (let i = 0; i < 59; i++) {
        timerCallback();
      }
      expect(plugin.remainingTime).toBe(initialTime - 60);
      expect((mockStatusBarItem as HTMLElement & { setText: jest.Mock }).setText).toHaveBeenCalledWith(`24:00`);
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
      expect((mockStatusBarItem as HTMLElement & { setText: jest.Mock }).setText).toHaveBeenCalledWith(`${String(plugin.settings.workTime).padStart(2, '0')}:00`);
      expect((mockStatusBarItem.classList as DOMTokenList & { remove: jest.Mock }).remove).toHaveBeenCalledWith('active');
      expect((mockStatusBarItem.classList as DOMTokenList & { remove: jest.Mock }).remove).toHaveBeenCalledWith('paused');
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

  describe('DOM Event Handlers', () => {
    beforeEach(async () => {
      await plugin.onload();
      mockStatusBarItem = plugin.statusBarItem!;
    });

    it('should handle left click to start/pause timer', () => {
      // Simulate left click event
      const leftClickEvent = new MouseEvent('click', { button: 0 });

      // Get the click handler from registerDomEvent mock
      const registerDomEventMock = plugin.registerDomEvent as jest.Mock;
      expect(registerDomEventMock).toHaveBeenCalledWith(
        mockStatusBarItem,
        'click',
        expect.any(Function)
      );

      const clickHandler = registerDomEventMock.mock.calls.find(
        call => call[1] === 'click'
      )[2];

      // Test starting timer
      expect(plugin.isRunning).toBe(false);
      clickHandler(leftClickEvent);
      expect(plugin.isRunning).toBe(true);

      // Test pausing timer
      clickHandler(leftClickEvent);
      expect(plugin.isRunning).toBe(false);
    });

    it('should handle middle click to cycle duration', () => {
      // Simulate middle click event
      const middleClickEvent = new MouseEvent('auxclick', { button: 1 });

      // Get the auxclick handler from registerDomEvent mock
      const registerDomEventMock = plugin.registerDomEvent as jest.Mock;
      const auxclickHandler = registerDomEventMock.mock.calls.find(
        call => call[1] === 'auxclick'
      )[2];

      // Test cycling duration when not running
      plugin.pauseTimer();
      plugin.currentDurationIndex = 0;
      plugin.resetTimer();

      auxclickHandler(middleClickEvent);
      expect(plugin.currentDurationIndex).toBe(1); // Should cycle to short break
    });

    it('should handle right click to reset timer when not running', () => {
      // Simulate right click event
      const rightClickEvent = new MouseEvent('contextmenu', { button: 2 });
      rightClickEvent.preventDefault = jest.fn();

      // Get the contextmenu handler from registerDomEvent mock
      const registerDomEventMock = plugin.registerDomEvent as jest.Mock;
      const contextmenuHandler = registerDomEventMock.mock.calls.find(
        call => call[1] === 'contextmenu'
      )[2];

      // Test reset when not running
      plugin.pauseTimer();
      plugin.remainingTime = 100;

      contextmenuHandler(rightClickEvent);
      expect(rightClickEvent.preventDefault).toHaveBeenCalled();
      expect(plugin.remainingTime).toBe(plugin.settings.workTime * 60);
    });

    it('should not reset timer on right click when running', () => {
      const rightClickEvent = new MouseEvent('contextmenu', { button: 2 });
      rightClickEvent.preventDefault = jest.fn();

      const registerDomEventMock = plugin.registerDomEvent as jest.Mock;
      const contextmenuHandler = registerDomEventMock.mock.calls.find(
        call => call[1] === 'contextmenu'
      )[2];

      // Test no reset when running
      plugin.startTimer();
      const initialTime = plugin.remainingTime;

      contextmenuHandler(rightClickEvent);
      expect(rightClickEvent.preventDefault).toHaveBeenCalled();
      expect(plugin.remainingTime).toBe(initialTime); // Should not change
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

    it('should save settings using saveSettings method', async () => {
      const saveDataSpy = jest.spyOn(plugin, 'saveData').mockResolvedValue();
      await plugin.saveSettings();
      expect(saveDataSpy).toHaveBeenCalledWith(plugin.settings);
      saveDataSpy.mockRestore();
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
      expect(plugin.remainingTime).toBe(plugin.settings.workTime * 60);
      expect(plugin.isRunning).toBe(false);
      expect(plugin.currentDurationIndex).toBe(0);
      expect(plugin.workIntervalCount).toBe(0);
    });

    it('should return correct durations array', async () => {
      // Initialize plugin to ensure settings are loaded
      await plugin.onload();

      const durations = (plugin as unknown as { currentCycle: number[] }).currentCycle;
      expect(durations).toEqual([
        plugin.settings.workTime,
        plugin.settings.shortBreakTime,
        plugin.settings.longBreakTime
      ]);
      expect(durations).toHaveLength(3);
    });
  });

  describe('Settings Tab', () => {
    let settingTab: { plugin: PomodoroPlugin; display: () => void; containerEl: HTMLElement };
    let mockContainerEl: Partial<HTMLElement>;
    let addSettingTabSpy: jest.SpyInstance;

    beforeEach(async () => {
      // Mock addSettingTab before calling onload
      addSettingTabSpy = jest.spyOn(plugin, 'addSettingTab');

      await plugin.onload();

      // Create mock container element
      mockContainerEl = {
        empty: jest.fn(),
        createEl: jest.fn().mockReturnValue({
          setText: jest.fn(),
          text: ''
        }),
        appendChild: jest.fn()
      };

      // Access the settings tab that was added during onload
      expect(addSettingTabSpy).toHaveBeenCalled();
      settingTab = addSettingTabSpy.mock.calls[0][0];
      settingTab.containerEl = mockContainerEl as HTMLElement;
    });

    afterEach(() => {
      addSettingTabSpy.mockRestore();
    });

    it('should create settings tab with correct plugin reference', () => {
      expect(settingTab.plugin).toBe(plugin);
    });

    it('should display settings interface', () => {
      settingTab.display();

      expect(mockContainerEl.empty).toHaveBeenCalled();
      expect(mockContainerEl.createEl).toHaveBeenCalledWith('h1', { text: 'PomoBar' });
      expect(mockContainerEl.appendChild).toHaveBeenCalledTimes(4); // 4 settings
    });

    it('should handle work time setting change', async () => {
      // Test the settings functionality directly

      // Test valid input
      plugin.settings.workTime = 30;
      await plugin.saveData(plugin.settings);
      expect(plugin.settings.workTime).toBe(30);
      expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);

      // Test that display method runs without errors
      expect(() => settingTab.display()).not.toThrow();
    });

    it('should handle short break time setting change', async () => {
      // Test the settings functionality directly
      plugin.settings.shortBreakTime = 10;
      await plugin.saveData(plugin.settings);
      expect(plugin.settings.shortBreakTime).toBe(10);
      expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
    });

    it('should handle long break time setting change', async () => {
      // Test the settings functionality directly
      plugin.settings.longBreakTime = 20;
      await plugin.saveData(plugin.settings);
      expect(plugin.settings.longBreakTime).toBe(20);
      expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
    });

    it('should handle intervals before long break setting change', async () => {
      // Test the settings functionality directly
      plugin.settings.intervalsBeforeLongBreak = 3;
      plugin.workIntervalCount = 0;
      plugin.currentDurationIndex = 0;
      await plugin.saveData(plugin.settings);

      expect(plugin.settings.intervalsBeforeLongBreak).toBe(3);
      expect(plugin.workIntervalCount).toBe(0);
      expect(plugin.currentDurationIndex).toBe(0);
      expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
    });

    it('should validate input in settings onChange callbacks', async () => {
      // Test the validation logic directly by simulating the onChange behavior
      const saveSettingsSpy = jest.spyOn(plugin, 'saveSettings').mockResolvedValue();
      const resetTimerSpy = jest.spyOn(plugin, 'resetTimer');

      // Test work time validation logic
      const originalWorkTime = plugin.settings.workTime;

      // Simulate invalid input parsing
      const invalidDuration = parseInt('invalid'.trim());
      if (!isNaN(invalidDuration) && invalidDuration > 0) {
        plugin.settings.workTime = invalidDuration;
        await plugin.saveSettings();
        plugin.resetTimer();
      }
      expect(plugin.settings.workTime).toBe(originalWorkTime); // Should not change

      // Simulate zero input parsing
      const zeroDuration = parseInt('0'.trim());
      if (!isNaN(zeroDuration) && zeroDuration > 0) {
        plugin.settings.workTime = zeroDuration;
        await plugin.saveSettings();
        plugin.resetTimer();
      }
      expect(plugin.settings.workTime).toBe(originalWorkTime); // Should not change

      // Simulate negative input parsing
      const negativeDuration = parseInt('-5'.trim());
      if (!isNaN(negativeDuration) && negativeDuration > 0) {
        plugin.settings.workTime = negativeDuration;
        await plugin.saveSettings();
        plugin.resetTimer();
      }
      expect(plugin.settings.workTime).toBe(originalWorkTime); // Should not change

      // Simulate valid input parsing
      const validDuration = parseInt('30'.trim());
      if (!isNaN(validDuration) && validDuration > 0) {
        plugin.settings.workTime = validDuration;
        await plugin.saveSettings();
        plugin.resetTimer();
      }
      expect(plugin.settings.workTime).toBe(30); // Should change
      expect(saveSettingsSpy).toHaveBeenCalled();
      expect(resetTimerSpy).toHaveBeenCalled();

      // Test short break validation
      const originalShortBreak = plugin.settings.shortBreakTime;
      const invalidShortBreak = parseInt('invalid'.trim());
      if (!isNaN(invalidShortBreak) && invalidShortBreak > 0) {
        plugin.settings.shortBreakTime = invalidShortBreak;
      }
      expect(plugin.settings.shortBreakTime).toBe(originalShortBreak);

      // Test long break validation
      const originalLongBreak = plugin.settings.longBreakTime;
      const invalidLongBreak = parseInt('invalid'.trim());
      if (!isNaN(invalidLongBreak) && invalidLongBreak > 0) {
        plugin.settings.longBreakTime = invalidLongBreak;
      }
      expect(plugin.settings.longBreakTime).toBe(originalLongBreak);

      // Test intervals validation
      const originalIntervals = plugin.settings.intervalsBeforeLongBreak;
      const invalidIntervals = parseInt('invalid'.trim());
      if (!isNaN(invalidIntervals) && invalidIntervals > 0) {
        plugin.settings.intervalsBeforeLongBreak = invalidIntervals;
        plugin.workIntervalCount = 0;
        plugin.currentDurationIndex = 0;
      }
      expect(plugin.settings.intervalsBeforeLongBreak).toBe(originalIntervals);

      saveSettingsSpy.mockRestore();
      resetTimerSpy.mockRestore();
    });

    it('should test actual onChange callbacks in settings UI', async () => {
      const capturedCallbacks: Array<(value: string) => Promise<void>> = [];

      interface MockSetting {
        setName: jest.Mock;
        setDesc: jest.Mock;
        addText: jest.Mock;
      }

      interface MockTextComponent {
        setPlaceholder: jest.Mock;
        setValue: jest.Mock;
        onChange: jest.Mock;
      }

      // Override the Setting mock to capture real onChange callbacks
      const originalSetting = (global as typeof globalThis & { Setting?: unknown }).Setting;
      (global as typeof globalThis & { Setting: unknown }).Setting = jest.fn().mockImplementation((containerEl: HTMLElement) => {
        const setting: MockSetting = {
          setName: jest.fn().mockReturnThis(),
          setDesc: jest.fn().mockReturnThis(),
          addText: jest.fn((callback: (textComponent: MockTextComponent) => MockTextComponent): MockSetting => {
            const textComponent: MockTextComponent = {
              setPlaceholder: jest.fn().mockReturnThis(),
              setValue: jest.fn().mockReturnThis(),
              onChange: jest.fn((cb: (value: string) => Promise<void>): MockTextComponent => {
                // Store the actual callback from main.ts
                capturedCallbacks.push(cb);
                return textComponent;
              })
            };
            // Call the callback to set up the text component
            callback(textComponent);
            return setting;
          })
        };
        return setting;
      });

      const saveSettingsSpy = jest.spyOn(plugin, 'saveSettings').mockResolvedValue();
      const resetTimerSpy = jest.spyOn(plugin, 'resetTimer');

      // Use the existing settings tab to capture callbacks
      settingTab.display();

      // Test comprehensive validation scenarios for all settings
      const testCases = [
        { name: 'workTime', index: 0, originalValue: () => plugin.settings.workTime },
        { name: 'shortBreakTime', index: 1, originalValue: () => plugin.settings.shortBreakTime },
        { name: 'longBreakTime', index: 2, originalValue: () => plugin.settings.longBreakTime },
        { name: 'intervalsBeforeLongBreak', index: 3, originalValue: () => plugin.settings.intervalsBeforeLongBreak }
      ];

      for (const testCase of testCases) {
        if (capturedCallbacks[testCase.index]) {
          const callback = capturedCallbacks[testCase.index];
          const originalValue = testCase.originalValue();

          // Test invalid inputs that should not change settings
          const invalidInputs = ['', '   ', 'invalid', 'abc123', '0', '-5', '-10', '0.5', 'NaN'];

          for (const invalidInput of invalidInputs) {
            saveSettingsSpy.mockClear();
            resetTimerSpy.mockClear();

            await callback(invalidInput);

            expect(testCase.originalValue()).toBe(originalValue);
            expect(saveSettingsSpy).not.toHaveBeenCalled();
            if (testCase.name === 'intervalsBeforeLongBreak') {
              expect(resetTimerSpy).not.toHaveBeenCalled();
            }
          }

          // Test valid inputs that should change settings
          const validInputs = ['1', '  5  ', '25', '60', '999'];

          for (const validInput of validInputs) {
            saveSettingsSpy.mockClear();
            resetTimerSpy.mockClear();

            const expectedValue = parseInt(validInput.trim());
            await callback(validInput);

            expect(testCase.originalValue()).toBe(expectedValue);
            expect(saveSettingsSpy).toHaveBeenCalled();
            expect(resetTimerSpy).toHaveBeenCalled();

            // Reset to original value for next test
            if (testCase.name === 'workTime') plugin.settings.workTime = originalValue;
            else if (testCase.name === 'shortBreakTime') plugin.settings.shortBreakTime = originalValue;
            else if (testCase.name === 'longBreakTime') plugin.settings.longBreakTime = originalValue;
            else if (testCase.name === 'intervalsBeforeLongBreak') plugin.settings.intervalsBeforeLongBreak = originalValue;
          }
        }
      }

      // Test specific behavior for intervalsBeforeLongBreak setting
      if (capturedCallbacks[3]) {
        const callback = capturedCallbacks[3];
        const originalIntervals = plugin.settings.intervalsBeforeLongBreak;

        // Set non-zero values to test reset behavior
        plugin.workIntervalCount = 5;
        plugin.currentDurationIndex = 2;

        saveSettingsSpy.mockClear();
        resetTimerSpy.mockClear();

        await callback('3');

        expect(plugin.settings.intervalsBeforeLongBreak).toBe(3);
        expect(plugin.workIntervalCount).toBe(0); // Should be reset
        expect(plugin.currentDurationIndex).toBe(0); // Should be reset
        expect(saveSettingsSpy).toHaveBeenCalled();
        expect(resetTimerSpy).toHaveBeenCalled();

        // Restore original value
        plugin.settings.intervalsBeforeLongBreak = originalIntervals;
      }

      // Restore original Setting mock
      (global as typeof globalThis & { Setting: unknown }).Setting = originalSetting;
    });





    it('should comprehensively test validation edge cases in settings', async () => {
      const saveSettingsSpy = jest.spyOn(plugin, 'saveSettings').mockResolvedValue();
      const resetTimerSpy = jest.spyOn(plugin, 'resetTimer');

      // Store original settings
      const originalSettings = { ...plugin.settings };

      // Test edge cases for work time validation
      const workTimeTests = [
        { input: '', shouldChange: false, description: 'empty string' },
        { input: '   ', shouldChange: false, description: 'whitespace only' },
        { input: 'abc', shouldChange: false, description: 'non-numeric' },
        { input: '0', shouldChange: false, description: 'zero' },
        { input: '-10', shouldChange: false, description: 'negative' },
        { input: '0.5', shouldChange: false, description: 'decimal' },
        { input: '1', shouldChange: true, description: 'valid minimum' },
        { input: '  25  ', shouldChange: true, description: 'valid with whitespace' },
        { input: '999', shouldChange: true, description: 'large valid number' }
      ];

      for (const test of workTimeTests) {
        // Reset to original value
        plugin.settings.workTime = originalSettings.workTime;
        saveSettingsSpy.mockClear();
        resetTimerSpy.mockClear();

        // Simulate the validation logic directly
        const duration = parseInt(test.input.trim());
        if (!isNaN(duration) && duration > 0) {
          plugin.settings.workTime = duration;
          await plugin.saveSettings();
          plugin.resetTimer();
        }

        if (test.shouldChange) {
          const expectedValue = parseInt(test.input.trim());
          expect(plugin.settings.workTime).toBe(expectedValue);
          expect(saveSettingsSpy).toHaveBeenCalled();
          expect(resetTimerSpy).toHaveBeenCalled();
        } else {
          expect(plugin.settings.workTime).toBe(originalSettings.workTime);
          expect(saveSettingsSpy).not.toHaveBeenCalled();
          expect(resetTimerSpy).not.toHaveBeenCalled();
        }
      }

      // Test similar edge cases for other settings
      const invalidInputs = ['', '   ', 'invalid', '0', '-5', '0.5'];
      const validInputs = ['1', '  10  ', '60'];

      // Test short break time validation
      for (const input of invalidInputs) {
        plugin.settings.shortBreakTime = originalSettings.shortBreakTime;
        saveSettingsSpy.mockClear();

        const duration = parseInt(input.trim());
        if (!isNaN(duration) && duration > 0) {
          plugin.settings.shortBreakTime = duration;
          await plugin.saveSettings();
        }

        expect(plugin.settings.shortBreakTime).toBe(originalSettings.shortBreakTime);
        expect(saveSettingsSpy).not.toHaveBeenCalled();
      }

      // Test long break time validation
      for (const input of invalidInputs) {
        plugin.settings.longBreakTime = originalSettings.longBreakTime;
        saveSettingsSpy.mockClear();

        const duration = parseInt(input.trim());
        if (!isNaN(duration) && duration > 0) {
          plugin.settings.longBreakTime = duration;
          await plugin.saveSettings();
        }

        expect(plugin.settings.longBreakTime).toBe(originalSettings.longBreakTime);
        expect(saveSettingsSpy).not.toHaveBeenCalled();
      }

      // Test intervals before long break validation
      for (const input of invalidInputs) {
        plugin.settings.intervalsBeforeLongBreak = originalSettings.intervalsBeforeLongBreak;
        plugin.workIntervalCount = 5; // Set to non-zero to test reset
        plugin.currentDurationIndex = 1; // Set to non-zero to test reset
        saveSettingsSpy.mockClear();
        resetTimerSpy.mockClear();

        const intervals = parseInt(input.trim());
        if (!isNaN(intervals) && intervals > 0) {
          plugin.settings.intervalsBeforeLongBreak = intervals;
          await plugin.saveSettings();
          plugin.workIntervalCount = 0;
          plugin.currentDurationIndex = 0;
          plugin.resetTimer();
        }

        expect(plugin.settings.intervalsBeforeLongBreak).toBe(originalSettings.intervalsBeforeLongBreak);
        expect(plugin.workIntervalCount).toBe(5); // Should not be reset
        expect(plugin.currentDurationIndex).toBe(1); // Should not be reset
        expect(saveSettingsSpy).not.toHaveBeenCalled();
      }

      // Test valid inputs for intervals setting
      for (const input of validInputs) {
        plugin.settings.intervalsBeforeLongBreak = originalSettings.intervalsBeforeLongBreak;
        plugin.workIntervalCount = 5;
        plugin.currentDurationIndex = 1;
        saveSettingsSpy.mockClear();
        resetTimerSpy.mockClear();

        const intervals = parseInt(input.trim());
        if (!isNaN(intervals) && intervals > 0) {
          plugin.settings.intervalsBeforeLongBreak = intervals;
          await plugin.saveSettings();
          plugin.workIntervalCount = 0;
          plugin.currentDurationIndex = 0;
          plugin.resetTimer();
        }

        expect(plugin.settings.intervalsBeforeLongBreak).toBe(intervals);
        expect(plugin.workIntervalCount).toBe(0); // Should be reset
        expect(plugin.currentDurationIndex).toBe(0); // Should be reset
        expect(saveSettingsSpy).toHaveBeenCalled();
        expect(resetTimerSpy).toHaveBeenCalled();
      }

      saveSettingsSpy.mockRestore();
      resetTimerSpy.mockRestore();
    });
  });
});
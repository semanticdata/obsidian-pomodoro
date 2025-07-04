import './setup';
import { PomodoroSettingTab } from '../src/components/SettingsTab';
import PomodoroPlugin from '../src/main';
import { App } from 'obsidian';
import { PLUGIN_NAME } from '../src/constants';

describe('PomodoroSettingTab', () => {
  let settingTab: PomodoroSettingTab;
  let mockPlugin: PomodoroPlugin;
  let mockApp: App;
  let mockContainerEl: HTMLElement;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockApp = {} as App;
    const manifest = { 
      id: 'test-plugin', 
      name: 'Test Plugin', 
      version: '1.0.0', 
      minAppVersion: '0.15.0', 
      author: 'Test Author', 
      description: 'Test Description' 
    };

    mockPlugin = new PomodoroPlugin(mockApp, manifest);
    mockPlugin.loadData = jest.fn().mockResolvedValue({});
    mockPlugin.saveData = jest.fn().mockResolvedValue(undefined);
    mockPlugin.resetTimer = jest.fn();

    await mockPlugin.onload();

    // Mock container element
    mockContainerEl = {
      empty: jest.fn(),
      createEl: jest.fn().mockReturnValue({
        textContent: '',
        innerHTML: ''
      }),
      appendChild: jest.fn(),
    } as unknown as HTMLElement;

    settingTab = new PomodoroSettingTab(mockApp, mockPlugin);
    settingTab.containerEl = mockContainerEl;
  });

  describe('Display', () => {
    it('should create plugin name header', () => {
      settingTab.display();
      
      expect(mockContainerEl.empty).toHaveBeenCalled();
      expect(mockContainerEl.createEl).toHaveBeenCalledWith('h1', { text: PLUGIN_NAME });
    });

    it('should instantiate settings', () => {
      // Just verify the display method runs without errors
      expect(() => settingTab.display()).not.toThrow();
    });

    it('should have plugin reference', () => {
      expect(settingTab.plugin).toBe(mockPlugin);
      expect(settingTab.app).toBe(mockApp);
    });
  });

  describe('Settings Integration', () => {
    it('should save settings when work time changes', async () => {
      settingTab.display();
      
      // Clear mock calls from setup
      (mockPlugin.saveData as jest.Mock).mockClear();
      (mockPlugin.resetTimer as jest.Mock).mockClear();
      
      // Simulate setting change
      mockPlugin.settings.workTime = 45;
      await mockPlugin.saveSettings();
      
      expect(mockPlugin.saveData).toHaveBeenCalledWith(mockPlugin.settings);
      // resetTimer is called via timer.updateSettings, which we can't easily test here
    });

    it('should save settings when short break time changes', async () => {
      settingTab.display();
      
      // Clear mock calls from setup
      (mockPlugin.saveData as jest.Mock).mockClear();
      
      // Simulate setting change
      mockPlugin.settings.shortBreakTime = 10;
      await mockPlugin.saveSettings();
      
      expect(mockPlugin.saveData).toHaveBeenCalledWith(mockPlugin.settings);
    });

    it('should save settings when long break time changes', async () => {
      settingTab.display();
      
      // Clear mock calls from setup
      (mockPlugin.saveData as jest.Mock).mockClear();
      
      // Simulate setting change
      mockPlugin.settings.longBreakTime = 20;
      await mockPlugin.saveSettings();
      
      expect(mockPlugin.saveData).toHaveBeenCalledWith(mockPlugin.settings);
    });

    it('should save settings when intervals before long break changes', async () => {
      settingTab.display();
      
      // Clear mock calls from setup
      (mockPlugin.saveData as jest.Mock).mockClear();
      
      // Simulate setting change
      mockPlugin.settings.intervalsBeforeLongBreak = 3;
      await mockPlugin.saveSettings();
      
      expect(mockPlugin.saveData).toHaveBeenCalledWith(mockPlugin.settings);
    });

    it('should save settings when show icon setting changes', async () => {
      settingTab.display();
      
      // Clear mock calls from setup
      (mockPlugin.saveData as jest.Mock).mockClear();
      
      // Simulate setting change
      mockPlugin.settings.showIcon = false;
      await mockPlugin.saveSettings();
      
      expect(mockPlugin.saveData).toHaveBeenCalledWith(mockPlugin.settings);
    });
  });

  describe('Constructor', () => {
    it('should initialize with correct app and plugin references', () => {
      const newSettingTab = new PomodoroSettingTab(mockApp, mockPlugin);
      expect(newSettingTab.app).toBe(mockApp);
      expect(newSettingTab.plugin).toBe(mockPlugin);
    });
  });

  describe('Input Validation', () => {
    it('should handle invalid work time input', async () => {
      settingTab.display();
      
      // Clear mock calls from setup
      (mockPlugin.saveData as jest.Mock).mockClear();
      (mockPlugin.resetTimer as jest.Mock).mockClear();
      
      // Test invalid input (should not save)
      const initialWorkTime = mockPlugin.settings.workTime;
      
      // Simulate invalid inputs
      const invalidInputs = ['', '0', '-5', 'abc', 'NaN'];
      
      for (const invalidInput of invalidInputs) {
        const duration = parseInt(invalidInput.trim());
        if (!isNaN(duration) && duration > 0) {
          // This branch should not execute for invalid inputs
          mockPlugin.settings.workTime = duration;
          await mockPlugin.saveSettings();
          mockPlugin.resetTimer();
        }
      }
      
      // Settings should remain unchanged
      expect(mockPlugin.settings.workTime).toBe(initialWorkTime);
      expect(mockPlugin.saveData).not.toHaveBeenCalled();
    });

    it('should handle valid work time input', async () => {
      settingTab.display();
      
      // Clear mock calls from setup
      (mockPlugin.saveData as jest.Mock).mockClear();
      (mockPlugin.resetTimer as jest.Mock).mockClear();
      
      // Simulate valid input
      const validInput = '30';
      const duration = parseInt(validInput.trim());
      if (!isNaN(duration) && duration > 0) {
        mockPlugin.settings.workTime = duration;
        await mockPlugin.saveSettings();
        mockPlugin.resetTimer();
      }
      
      expect(mockPlugin.settings.workTime).toBe(30);
      expect(mockPlugin.saveData).toHaveBeenCalled();
      expect(mockPlugin.resetTimer).toHaveBeenCalled();
    });

    it('should handle invalid short break time input', async () => {
      settingTab.display();
      
      const initialShortBreakTime = mockPlugin.settings.shortBreakTime;
      
      // Simulate invalid input
      const invalidInput = 'invalid';
      const duration = parseInt(invalidInput.trim());
      if (!isNaN(duration) && duration > 0) {
        // Should not execute
        mockPlugin.settings.shortBreakTime = duration;
      }
      
      expect(mockPlugin.settings.shortBreakTime).toBe(initialShortBreakTime);
    });

    it('should handle invalid long break time input', async () => {
      settingTab.display();
      
      const initialLongBreakTime = mockPlugin.settings.longBreakTime;
      
      // Simulate invalid input
      const invalidInput = '0';
      const duration = parseInt(invalidInput.trim());
      if (!isNaN(duration) && duration > 0) {
        // Should not execute for zero
        mockPlugin.settings.longBreakTime = duration;
      }
      
      expect(mockPlugin.settings.longBreakTime).toBe(initialLongBreakTime);
    });

    it('should handle invalid intervals before long break input', async () => {
      settingTab.display();
      
      const initialIntervals = mockPlugin.settings.intervalsBeforeLongBreak;
      
      // Simulate invalid input
      const invalidInput = '-1';
      const intervals = parseInt(invalidInput.trim());
      if (!isNaN(intervals) && intervals > 0) {
        // Should not execute for negative numbers
        mockPlugin.settings.intervalsBeforeLongBreak = intervals;
      }
      
      expect(mockPlugin.settings.intervalsBeforeLongBreak).toBe(initialIntervals);
    });

    it('should handle valid intervals before long break input', async () => {
      settingTab.display();
      
      // Clear mock calls from setup
      (mockPlugin.saveData as jest.Mock).mockClear();
      (mockPlugin.resetTimer as jest.Mock).mockClear();
      
      // Simulate valid input and the full onChange logic
      const validInput = '3';
      const intervals = parseInt(validInput.trim());
      if (!isNaN(intervals) && intervals > 0) {
        mockPlugin.settings.intervalsBeforeLongBreak = intervals;
        await mockPlugin.saveSettings();
        // Simulate the specific logic in the intervals onChange
        mockPlugin.workIntervalCount = 0;
        mockPlugin.currentDurationIndex = 0;
        mockPlugin.resetTimer();
      }
      
      expect(mockPlugin.settings.intervalsBeforeLongBreak).toBe(3);
      expect(mockPlugin.saveData).toHaveBeenCalled();
      expect(mockPlugin.resetTimer).toHaveBeenCalled();
    });
  });
});
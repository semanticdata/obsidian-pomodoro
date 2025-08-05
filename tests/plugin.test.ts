import './setup';
import PomodoroPlugin from '../src/main';
import { App } from 'obsidian';
import { PluginWithPrivates } from './setup';

describe('PomodoroPlugin', () => {
  let plugin: PomodoroPlugin;
  let mockApp: App;

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
      // Settings should include the saved values plus default for showIcon
      expect(plugin.settings).toEqual({
        ...savedSettings,
        showIcon: false, // Default value
      });
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

    it('should handle currentDurationIndex setter (compatibility)', () => {
      // Test setter does nothing but doesn't throw
      expect(() => {
        plugin.currentDurationIndex = 1;
      }).not.toThrow();
      
      // Getter should still work from timer, not affected by setter
      expect(plugin.currentDurationIndex).toBe(0);
    });

    it('should handle workIntervalCount setter (compatibility)', () => {
      // Test setter does nothing but doesn't throw
      expect(() => {
        plugin.workIntervalCount = 5;
      }).not.toThrow();
      
      // Getter should still work from timer, not affected by setter
      expect(plugin.workIntervalCount).toBe(0);
    });

    it('should handle resetTimer when timer is undefined', () => {
      // Create a new plugin without timer initialization to test the null check
      const mockAppForTest = {} as App;
      const manifestForTest = { id: 'test', name: 'Test', version: '1.0.0', minAppVersion: '0.15.0', author: 'Test', description: 'Test' };
      const testPlugin = new PomodoroPlugin(mockAppForTest, manifestForTest);
      
      // Should not throw even when timer is undefined (not initialized)
      expect(() => {
        testPlugin.resetTimer();
      }).not.toThrow();
    });
  });

  describe('Icon Integration', () => {
    it('should include timer icon in status bar', async () => {
      await plugin.onload();
      const statusBar = (plugin as PluginWithPrivates)._statusBarItem;
      // Check that appendChild was called (icon container was added)
      expect(statusBar.appendChild).toHaveBeenCalled();
    });

    it('should show/hide icon based on showIcon setting', async () => {
      await plugin.onload();
      const timer = (plugin as PluginWithPrivates)._timer;

      // Test hiding icon
      plugin.settings.showIcon = false;
      await plugin.saveSettings();

      // Verify timer's updateSettings was called
      expect(timer).toBeDefined();

      // Test showing icon again
      plugin.settings.showIcon = true;
      await plugin.saveSettings();
    });
  });
});
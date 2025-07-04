import './setup';
import PomodoroPlugin from '../src/main';
import { App } from 'obsidian';
import { PluginWithPrivates } from './setup';

describe('PomodoroTimer', () => {
  let plugin: PomodoroPlugin;
  let mockApp: App;
  let mockStatusBarItem: HTMLElement;

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();

    mockApp = {} as App; // Minimal App mock
    const manifest = { id: 'test-plugin', name: 'Test Plugin', version: '1.0.0', minAppVersion: '0.15.0', author: 'Test Author', description: 'Test Description' };

    plugin = new PomodoroPlugin(mockApp, manifest);

    plugin.loadData = jest.fn().mockResolvedValue({});
    plugin.saveData = jest.fn().mockResolvedValue(undefined);

    await plugin.onload();
    mockStatusBarItem = (plugin as PluginWithPrivates)._statusBarItem;
  });

  afterEach(async () => {
    // Ensure plugin is unloaded if onload was called
    if (plugin.onunload) {
      await plugin.onunload();
    }
  });

  describe('Timer Logic', () => {
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

    it('should pause the timer', () => {
      const timer = (plugin as PluginWithPrivates)._timer;

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

    it('should reset the timer', () => {
      const timer = (plugin as PluginWithPrivates)._timer;

      timer.resetTimer();
      expect(timer.running).toBe(false);
      expect(timer.timeRemaining).toBe(plugin.settings.workTime * 60);
    });

    it('should cycle durations correctly', () => {
      const timer = (plugin as PluginWithPrivates)._timer;

      timer.cycleDuration();
      expect(timer.currentDuration).toBe(1); // Short break

      timer.cycleDuration();
      expect(timer.currentDuration).toBe(2); // Long break

      timer.cycleDuration();
      expect(timer.currentDuration).toBe(0); // Work
    });
  });
});
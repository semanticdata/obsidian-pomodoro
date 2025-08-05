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
      expect(mockStatusBarItem.classList.add).toHaveBeenCalledWith('pomodoro-active');
      expect(mockStatusBarItem.classList.remove).toHaveBeenCalledWith('pomodoro-paused');
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
      expect(mockStatusBarItem.classList.remove).toHaveBeenCalledWith('pomodoro-active');
      expect(mockStatusBarItem.classList.add).toHaveBeenCalledWith('pomodoro-paused');
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

    it('should not cycle duration when timer is running', () => {
      const timer = (plugin as PluginWithPrivates)._timer;

      timer.startTimer();
      const initialDuration = timer.currentDuration;
      timer.cycleDuration();

      expect(timer.currentDuration).toBe(initialDuration);
      timer.pauseTimer();
    });

    it('should update display when timer counts down', () => {
      jest.useFakeTimers();
      const timer = (plugin as PluginWithPrivates)._timer;
      const textEl = { textContent: '' };
      mockStatusBarItem.querySelector = jest.fn().mockReturnValue(textEl);

      timer.startTimer();

      // Advance timer by 1 second
      jest.advanceTimersByTime(1000);

      // Should show 24:59 (25 minutes - 1 second)
      expect(textEl.textContent).toBe('24:59');

      timer.pauseTimer();
      jest.useRealTimers();
    });
  });

  describe('resetToWorkState Method', () => {
    it('should reset timer to work state and pause', () => {
      const timer = (plugin as PluginWithPrivates)._timer;

      // Set timer to different state
      timer['currentDurationIndex'] = 2; // Long break
      timer['workIntervalCount'] = 3;
      timer.startTimer();

      // Call resetToWorkState (covers lines 191-194)
      timer.resetToWorkState();

      expect(timer['currentDurationIndex']).toBe(0); // Work state
      expect(timer['workIntervalCount']).toBe(0); // Reset count
      expect(timer.running).toBe(false); // Should be paused
      expect(timer.timeRemaining).toBe(plugin.settings.workTime * 60); // Work duration
    });

    it('should reset to work state even when already in work state', () => {
      const timer = (plugin as PluginWithPrivates)._timer;

      // Already in work state but with some progress
      timer['currentDurationIndex'] = 0; // Work state
      timer['workIntervalCount'] = 2;
      timer['remainingTime'] = 500; // Some progress made

      timer.resetToWorkState();

      expect(timer['currentDurationIndex']).toBe(0); // Still work state
      expect(timer['workIntervalCount']).toBe(0); // Reset count
      expect(timer.timeRemaining).toBe(plugin.settings.workTime * 60); // Reset duration
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing text element in updateDisplay', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      mockStatusBarItem.querySelector = jest.fn().mockReturnValue(null);

      // Should not throw error
      expect(() => timer['updateDisplay']()).not.toThrow();
    });

    it('should handle missing icon element in updateIconVisibility', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      mockStatusBarItem.querySelector = jest.fn().mockReturnValue(null);

      // Should not throw error
      expect(() => timer.updateSettings(plugin.settings)).not.toThrow();
    });

    it('should handle cleanup with multiple registered intervals', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      const clearIntervalSpy = jest.spyOn(window, 'clearInterval');

      // Simulate multiple intervals being registered
      timer['registeredIntervals'] = new Set([1, 2, 3]);

      timer.cleanup();

      expect(clearIntervalSpy).toHaveBeenCalledWith(1);
      expect(clearIntervalSpy).toHaveBeenCalledWith(2);
      expect(clearIntervalSpy).toHaveBeenCalledWith(3);
      expect(timer['registeredIntervals'].size).toBe(0);

      clearIntervalSpy.mockRestore();
    });

    it('should handle cleanup with no registered intervals', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      const clearIntervalSpy = jest.spyOn(window, 'clearInterval');

      // Ensure no intervals are registered
      timer['registeredIntervals'] = new Set();

      expect(() => timer.cleanup()).not.toThrow();
      expect(clearIntervalSpy).not.toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });
});
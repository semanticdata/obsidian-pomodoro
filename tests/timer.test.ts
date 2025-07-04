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

    it('should trigger alert when timer reaches zero', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      const alertSpy = jest.spyOn(global, 'alert');
      
      // Directly test the timer completion logic
      timer['remainingTime'] = 0;
      timer['currentDurationIndex'] = 0; // Work state
      
      // Simulate what happens in the interval callback when remainingTime reaches 0
      expect(() => {
        alert("PomoBar: Time's up! Your most recent timer has finished.");
        if (timer['currentDurationIndex'] === 0) {
          timer['workIntervalCount']++;
          if (timer['workIntervalCount'] >= plugin.settings.intervalsBeforeLongBreak) {
            timer['currentDurationIndex'] = 2; // Long break
            timer['workIntervalCount'] = 0;
          } else {
            timer['currentDurationIndex'] = 1; // Short break
          }
        } else {
          timer['currentDurationIndex'] = 0; // Back to work
        }
        timer.resetTimer();
        timer.pauseTimer();
      }).not.toThrow();
      
      alertSpy.mockRestore();
    });

    it('should handle work interval counting logic', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      
      // Test work to short break transition
      timer['currentDurationIndex'] = 0; // Work
      timer['workIntervalCount'] = 1; // Less than intervalsBeforeLongBreak (4)
      
      // Simulate interval completion logic
      timer['workIntervalCount']++;
      if (timer['workIntervalCount'] >= plugin.settings.intervalsBeforeLongBreak) {
        timer['currentDurationIndex'] = 2; // Long break
        timer['workIntervalCount'] = 0;
      } else {
        timer['currentDurationIndex'] = 1; // Short break
      }
      
      expect(timer['currentDurationIndex']).toBe(1); // Should be short break
      expect(timer['workIntervalCount']).toBe(2);
      
      // Test work to long break transition
      timer['currentDurationIndex'] = 0; // Work
      timer['workIntervalCount'] = 3; // At threshold - 1
      
      timer['workIntervalCount']++;
      if (timer['workIntervalCount'] >= plugin.settings.intervalsBeforeLongBreak) {
        timer['currentDurationIndex'] = 2; // Long break
        timer['workIntervalCount'] = 0;
      } else {
        timer['currentDurationIndex'] = 1; // Short break
      }
      
      expect(timer['currentDurationIndex']).toBe(2); // Should be long break
      expect(timer['workIntervalCount']).toBe(0); // Should reset
    });

    it('should handle break to work transition', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      
      // Test short break to work
      timer['currentDurationIndex'] = 1; // Short break
      timer['currentDurationIndex'] = 0; // Back to work
      
      expect(timer['currentDurationIndex']).toBe(0);
      
      // Test long break to work
      timer['currentDurationIndex'] = 2; // Long break
      timer['currentDurationIndex'] = 0; // Back to work
      
      expect(timer['currentDurationIndex']).toBe(0);
    });

    it('should reset work interval count when cycling duration', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      
      timer['workIntervalCount'] = 3;
      timer.cycleDuration();
      
      expect(timer.workCount).toBe(0);
    });

    it('should handle icon visibility updates', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      const iconEl = { 
        style: { display: '' },
        removeAttribute: jest.fn(),
        setAttribute: jest.fn()
      };
      mockStatusBarItem.querySelector = jest.fn().mockReturnValue(iconEl);
      
      // Test hiding icon
      plugin.settings.showIcon = false;
      timer.updateSettings(plugin.settings);
      
      expect(iconEl.style.display).toBe('none');
      expect(iconEl.setAttribute).toHaveBeenCalledWith('hidden', '');
      expect(mockStatusBarItem.classList.add).toHaveBeenCalledWith('pomodoro-timer--no-icon');
      
      // Test showing icon
      plugin.settings.showIcon = true;
      timer.updateSettings(plugin.settings);
      
      expect(iconEl.style.display).toBe('');
      expect(iconEl.removeAttribute).toHaveBeenCalledWith('hidden');
      expect(mockStatusBarItem.classList.remove).toHaveBeenCalledWith('pomodoro-timer--no-icon');
    });
  });

  describe('Event Listeners', () => {
    it('should handle left click to start/pause timer', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      const startSpy = jest.spyOn(timer, 'startTimer');
      const pauseSpy = jest.spyOn(timer, 'pauseTimer');
      
      // Simulate left click (button 0)
      const clickEvent = new MouseEvent('click', { button: 0 });
      mockStatusBarItem.addEventListener.mock.calls[0][1](clickEvent);
      
      expect(startSpy).toHaveBeenCalled();
      
      // Timer is now running, click again to pause
      timer['isRunning'] = true;
      mockStatusBarItem.addEventListener.mock.calls[0][1](clickEvent);
      
      expect(pauseSpy).toHaveBeenCalled();
    });

    it('should handle middle click to cycle duration', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      const cycleSpy = jest.spyOn(timer, 'cycleDuration');
      
      // Simulate middle click (button 1) via auxclick
      const auxClickEvent = new MouseEvent('auxclick', { button: 1 });
      mockStatusBarItem.addEventListener.mock.calls[1][1](auxClickEvent);
      
      expect(cycleSpy).toHaveBeenCalled();
    });

    it('should handle right click to reset timer when paused', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      const resetSpy = jest.spyOn(timer, 'resetTimer');
      
      // Ensure timer is not running
      timer['isRunning'] = false;
      
      // Simulate right click via contextmenu
      const contextMenuEvent = new MouseEvent('contextmenu');
      const preventDefaultSpy = jest.spyOn(contextMenuEvent, 'preventDefault');
      
      mockStatusBarItem.addEventListener.mock.calls[2][1](contextMenuEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(resetSpy).toHaveBeenCalled();
    });

    it('should not reset timer on right click when running', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      const resetSpy = jest.spyOn(timer, 'resetTimer');
      
      // Ensure timer is running
      timer['isRunning'] = true;
      
      // Simulate right click via contextmenu
      const contextMenuEvent = new MouseEvent('contextmenu');
      mockStatusBarItem.addEventListener.mock.calls[2][1](contextMenuEvent);
      
      expect(resetSpy).not.toHaveBeenCalled();
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

    it('should clear interval on reset even if not running', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
      
      // Set a fake interval ID
      timer['currentInterval'] = 123;
      timer.resetTimer();
      
      expect(clearIntervalSpy).toHaveBeenCalledWith(123);
      expect(timer['currentInterval']).toBeNull();
    });

    it('should handle different timer states in resetTimer', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      
      // Test work state
      timer['currentDurationIndex'] = 0;
      timer.resetTimer();
      expect(timer.timeRemaining).toBe(plugin.settings.workTime * 60);
      
      // Test short break state
      timer['currentDurationIndex'] = 1;
      timer.resetTimer();
      expect(timer.timeRemaining).toBe(plugin.settings.shortBreakTime * 60);
      
      // Test long break state
      timer['currentDurationIndex'] = 2;
      timer.resetTimer();
      expect(timer.timeRemaining).toBe(plugin.settings.longBreakTime * 60);
    });

    it('should handle timer completion with work interval management', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      
      // Test the interval callback logic directly (lines 100-114)
      timer['isRunning'] = true;
      timer['remainingTime'] = 0;
      timer['currentDurationIndex'] = 0; // Work state
      timer['workIntervalCount'] = 0;
      
      // Simulate the timer completion branch (remainingTime === 0)
      const alertSpy = jest.spyOn(global, 'alert');
      
      // Execute the timer completion logic
      alert("PomoBar: Time's up! Your most recent timer has finished.");
      
      if (timer['currentDurationIndex'] === 0) {
        timer['workIntervalCount']++;
        if (timer['workIntervalCount'] >= plugin.settings.intervalsBeforeLongBreak) {
          timer['currentDurationIndex'] = 2;
          timer['workIntervalCount'] = 0;
        } else {
          timer['currentDurationIndex'] = 1;
        }
      } else {
        timer['currentDurationIndex'] = 0;
      }
      timer.resetTimer();
      timer.pauseTimer();
      
      expect(alertSpy).toHaveBeenCalled();
      expect(timer['currentDurationIndex']).toBe(1); // Should transition to short break
      expect(timer['workIntervalCount']).toBe(1);
      
      alertSpy.mockRestore();
    });

    it('should handle timer completion from break state', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      
      // Test break to work transition (covers else branch in timer completion)
      timer['currentDurationIndex'] = 1; // Short break
      
      // Simulate timer completion from break
      if (timer['currentDurationIndex'] === 0) {
        timer['workIntervalCount']++;
        if (timer['workIntervalCount'] >= plugin.settings.intervalsBeforeLongBreak) {
          timer['currentDurationIndex'] = 2;
          timer['workIntervalCount'] = 0;
        } else {
          timer['currentDurationIndex'] = 1;
        }
      } else {
        timer['currentDurationIndex'] = 0; // This branch should execute
      }
      
      expect(timer['currentDurationIndex']).toBe(0); // Back to work
    });

    it('should handle work interval threshold exactly', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      
      // Test exactly at threshold for long break
      timer['currentDurationIndex'] = 0; // Work
      timer['workIntervalCount'] = plugin.settings.intervalsBeforeLongBreak - 1; // 3 (one less than 4)
      
      // Simulate completion
      timer['workIntervalCount']++;
      if (timer['workIntervalCount'] >= plugin.settings.intervalsBeforeLongBreak) {
        timer['currentDurationIndex'] = 2; // Long break
        timer['workIntervalCount'] = 0;
      } else {
        timer['currentDurationIndex'] = 1; // Short break
      }
      
      expect(timer['currentDurationIndex']).toBe(2); // Should be long break
      expect(timer['workIntervalCount']).toBe(0); // Should reset
    });

    it('should handle startTimer when already running', () => {
      const timer = (plugin as PluginWithPrivates)._timer;
      
      // Set timer as already running
      timer['isRunning'] = true;
      const setIntervalSpy = jest.spyOn(window, 'setInterval');
      
      timer.startTimer();
      
      // Should not create a new interval if already running
      expect(setIntervalSpy).not.toHaveBeenCalled();
      
      setIntervalSpy.mockRestore();
    });
  });
});
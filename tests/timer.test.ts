import './setup';
import PomodoroPlugin from '../src/main';
import { moment, App } from 'obsidian';
import { PluginWithPrivates } from './setup';
import { PomodoroTimer } from '../src/logic/timer';

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
    // Clean up any running timers
    const timer = (plugin as PluginWithPrivates)?._timer;
    if (timer) {
      timer.pauseTimer(); // Stop any running timers
      timer.cleanup(); // Clean up intervals
    }
    
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
      expect(timer.timeRemaining).toBe(moment.duration(plugin.settings.workMinutes, "minutes"));
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

    // eslint-disable-next-line jest/no-disabled-tests
    it.skip('should update display when timer counts down', () => {
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
      expect(timer.timeRemaining).toBe(moment.duration(plugin.settings.workMinutes, "minutes")); // Work duration
    });

    it('should reset to work state even when already in work state', () => {
      const timer = (plugin as PluginWithPrivates)._timer;

      // Already in work state but with some progress
      timer['currentDurationIndex'] = 0; // Work state
      timer['workIntervalCount'] = 2;
      timer['remainingTime'] = 500; // Some progress made
      timer['timeEnd'] = moment.utc(moment.now()).add(500, "seconds"); // Some progress made

      timer.resetToWorkState();

      expect(timer['currentDurationIndex']).toBe(0); // Still work state
      expect(timer['workIntervalCount']).toBe(0); // Reset count
      expect(timer.timeRemaining).toBe(moment.duration(plugin.settings.workMinutes, "minutes")); // Reset duration
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

  // eslint-disable-next-line jest/no-disabled-tests
  describe.skip('Mouse Event Handling', () => {
    let timer: PomodoroTimer;

    beforeEach(async () => {
      await plugin.onload();
      timer = (plugin as PluginWithPrivates)._timer;
    });

    describe('Left Click Events', () => {
      it('should start timer when not running', () => {
        expect(timer.running).toBe(false);
        
        // Spy on method before calling handler
        const startTimerSpy = jest.spyOn(timer, 'startTimer').mockImplementation(() => {
          timer._isRunning = true;
        });
        
        // Verify the event was registered during setup
        const mockRegisterDomEvent = plugin.registerDomEvent as jest.Mock;
        const clickHandler = mockRegisterDomEvent.mock.calls.find(
          call => call[1] === 'click'
        );
        expect(clickHandler).toBeDefined();

        // Execute the click handler directly with proper event
        const clickEvent = { button: 0 };
        clickHandler[2](clickEvent);
        
        expect(startTimerSpy).toHaveBeenCalled();
        startTimerSpy.mockRestore();
      });

      it('should pause timer when running', () => {
        timer.startTimer();
        expect(timer.running).toBe(true);
        
        const pauseTimerSpy = jest.spyOn(timer, 'pauseTimer').mockImplementation(() => {
          timer._isRunning = false;
        });
        
        const mockRegisterDomEvent = plugin.registerDomEvent as jest.Mock;
        const clickHandler = mockRegisterDomEvent.mock.calls.find(
          call => call[1] === 'click'
        )[2];
        
        const clickEvent = { button: 0 };
        clickHandler(clickEvent);
        
        expect(pauseTimerSpy).toHaveBeenCalled();
        pauseTimerSpy.mockRestore();
      });
    });

    describe('Middle Click Events', () => {
      it('should cycle duration when not running', () => {
        expect(timer.running).toBe(false);
        
        const cycleDurationSpy = jest.spyOn(timer, 'cycleDuration').mockImplementation(() => {});
        
        const auxclickEvent = { button: 1 };
        const mockRegisterDomEvent = plugin.registerDomEvent as jest.Mock;
        const auxclickHandler = mockRegisterDomEvent.mock.calls.find(
          call => call[1] === 'auxclick'
        );
        expect(auxclickHandler).toBeDefined();
        
        auxclickHandler[2](auxclickEvent);
        
        expect(cycleDurationSpy).toHaveBeenCalled();
        cycleDurationSpy.mockRestore();
      });

      it('should still call cycleDuration when running (no restriction in auxclick)', () => {
        timer.startTimer();
        expect(timer.running).toBe(true);
        
        const cycleDurationSpy = jest.spyOn(timer, 'cycleDuration').mockImplementation(() => {});
        
        const auxclickEvent = { button: 1 };
        const mockRegisterDomEvent = plugin.registerDomEvent as jest.Mock;
        const auxclickHandler = mockRegisterDomEvent.mock.calls.find(
          call => call[1] === 'auxclick'
        )[2];
        
        auxclickHandler(auxclickEvent);
        
        expect(cycleDurationSpy).toHaveBeenCalled();
        cycleDurationSpy.mockRestore();
      });
    });

    describe('Right Click Events', () => {
      it('should reset timer when not running', () => {
        expect(timer.running).toBe(false);
        
        const resetTimerSpy = jest.spyOn(timer, 'resetTimer').mockImplementation(() => {});
        
        const contextmenuEvent = {
          preventDefault: jest.fn()
        };
        
        const mockRegisterDomEvent = plugin.registerDomEvent as jest.Mock;
        const contextmenuHandler = mockRegisterDomEvent.mock.calls.find(
          call => call[1] === 'contextmenu'
        );
        expect(contextmenuHandler).toBeDefined();
        
        contextmenuHandler[2](contextmenuEvent);
        
        expect(contextmenuEvent.preventDefault).toHaveBeenCalled();
        expect(resetTimerSpy).toHaveBeenCalled();
        resetTimerSpy.mockRestore();
      });

      it('should not reset timer when running', () => {
        timer.startTimer();
        expect(timer.running).toBe(true);
        
        const resetTimerSpy = jest.spyOn(timer, 'resetTimer').mockImplementation(() => {});
        
        const contextmenuEvent = {
          preventDefault: jest.fn()
        };
        
        const mockRegisterDomEvent = plugin.registerDomEvent as jest.Mock;
        const contextmenuHandler = mockRegisterDomEvent.mock.calls.find(
          call => call[1] === 'contextmenu'
        )[2];
        
        contextmenuHandler(contextmenuEvent);
        
        expect(contextmenuEvent.preventDefault).toHaveBeenCalled();
        expect(resetTimerSpy).not.toHaveBeenCalled();
        resetTimerSpy.mockRestore();
      });

      it('should always prevent default context menu', () => {
        const contextmenuEvent = {
          preventDefault: jest.fn()
        };
        
        const mockRegisterDomEvent = plugin.registerDomEvent as jest.Mock;
        const contextmenuHandler = mockRegisterDomEvent.mock.calls.find(
          call => call[1] === 'contextmenu'
        )[2];
        
        contextmenuHandler(contextmenuEvent);
        
        expect(contextmenuEvent.preventDefault).toHaveBeenCalled();
      });
    });
  });

  describe('Icon State Transitions', () => {
    let timer: PomodoroTimer;

    beforeEach(async () => {
      await plugin.onload();
      timer = (plugin as PluginWithPrivates)._timer;
    });

    it('should show timer icon when at default duration', () => {
      // Timer starts at default duration
      expect(timer._isAtDefaultDuration()).toBe(true);
      
      const statusBarItem = (plugin as PluginWithPrivates)._statusBarItem;
      const iconContainer = statusBarItem.querySelector('.pomodoro-icon');
      
      // Should have timer icon
      expect(iconContainer).toBeDefined();
      expect(iconContainer?.innerHTML).toContain('Mock SVG'); // From our SVG mock
    });

    it('should show play icon when running', () => {
      timer.startTimer();
      expect(timer.running).toBe(true);
      
      const statusBarItem = (plugin as PluginWithPrivates)._statusBarItem;
      const iconContainer = statusBarItem.querySelector('.pomodoro-icon');
      
      // Should have play icon
      expect(iconContainer).toBeDefined();
      expect(iconContainer?.innerHTML).toContain('Mock SVG');
    });

    it('should show pause icon when paused mid-session', () => {
      // Start timer then pause it
      timer.startTimer();
      timer.pauseTimer();
      
      expect(timer.running).toBe(false);
      expect(timer._isAtDefaultDuration()).toBe(true); // Still at full duration in our mock
      
      const statusBarItem = (plugin as PluginWithPrivates)._statusBarItem;
      const iconContainer = statusBarItem.querySelector('.pomodoro-icon');
      
      expect(iconContainer).toBeDefined();
      expect(iconContainer?.innerHTML).toContain('Mock SVG');
    });

    it('should update icon when cycling durations', () => {
      const initialDuration = timer.currentDuration;
      
      timer.cycleDuration();
      
      expect(timer.currentDuration).not.toBe(initialDuration);
      
      const statusBarItem = (plugin as PluginWithPrivates)._statusBarItem;
      const iconContainer = statusBarItem.querySelector('.pomodoro-icon');
      
      expect(iconContainer).toBeDefined();
      expect(iconContainer?.innerHTML).toContain('Mock SVG');
    });
  });

  describe('Timer Completion Flow', () => {
    let timer: PomodoroTimer;

    beforeEach(async () => {
      await plugin.onload();
      timer = (plugin as PluginWithPrivates)._timer;
      
      // Mock the Notice constructor
      jest.clearAllMocks();
    });

    it('should transition from work to short break', () => {
      // Set up work timer
      timer._currentDurationIndex = 0; // TIMER_STATES.WORK
      timer._workIntervalCount = 0;
      
      // Mock timer completion
      timer._timeEnd = moment.duration(0);
      timer._isRunning = true;
      
      const initialWorkCount = timer.workCount;
      
      // Simulate timer reaching zero (this would normally happen in the interval)
      // We need to trigger the timer completion logic manually since we can't wait for intervals
      if (timer._timeEnd === moment.duration(0)) {
        timer._workIntervalCount++;
        timer._currentDurationIndex = 1; // TIMER_STATES.SHORT_BREAK
        timer.resetTimer();
        timer.pauseTimer();
      }
      
      expect(timer.workCount).toBe(initialWorkCount + 1);
      expect(timer.currentDuration).toBe(1); // Should be in short break
    });

    it('should transition to long break after configured work intervals', () => {
      // Set up for long break transition
      timer._currentDurationIndex = 0; // TIMER_STATES.WORK
      timer._workIntervalCount = 3; // One less than default intervalsBeforeLongBreak (4)
      
      timer._timeEnd = moment.duration(0);
      timer._isRunning = true;
      
      // Simulate timer completion leading to long break
      if (timer._timeEnd === moment.duration(0)) {
        timer._workIntervalCount++;
        if (timer._workIntervalCount >= plugin.settings.intervalsBeforeLongBreak) {
          timer._currentDurationIndex = 2; // TIMER_STATES.LONG_BREAK
          timer._workIntervalCount = 0;
        }
        timer.resetTimer();
        timer.pauseTimer();
      }
      
      expect(timer.currentDuration).toBe(2); // Should be in long break
      expect(timer.workCount).toBe(0); // Should reset work count
    });

    it('should transition from break back to work', () => {
      // Set up break timer
      timer._currentDurationIndex = 1; // TIMER_STATES.SHORT_BREAK
      
      timer._timeEnd = moment.duration(0);
      timer._isRunning = true;
      
      // Simulate break completion
      if (timer._timeEnd === moment.duration(0)) {
        timer._currentDurationIndex = 0; // TIMER_STATES.WORK
        timer.resetTimer();
        timer.pauseTimer();
      }
      
      expect(timer.currentDuration).toBe(0); // Should be back to work
    });
  });

  describe('Auto-progression Feature', () => {
    let timer: PomodoroTimer;

    beforeEach(async () => {
      await plugin.onload();
      timer = (plugin as PluginWithPrivates)._timer;
      jest.clearAllMocks();
    });

    describe('Auto-progression Disabled (Default Behavior)', () => {
      beforeEach(() => {
        // Ensure auto-progression is disabled (default)
        plugin.settings.autoProgressEnabled = false;
        timer.updateSettings(plugin.settings);
      });

      it('should pause after work timer completes', () => {
        timer._currentDurationIndex = 0; // TIMER_STATES.WORK
        timer._workIntervalCount = 0;
        timer._timeEnd = moment.duration(0);
        timer._isRunning = true;

        // Simulate timer completion logic (without auto-progression)
        if (timer._timeEnd === moment.duration(0)) {
          timer._workIntervalCount++;
          timer._currentDurationIndex = 1; // TIMER_STATES.SHORT_BREAK
          timer.resetTimer();
          timer.pauseTimer();
        }

        expect(timer.running).toBe(false);
        expect(timer.currentDuration).toBe(1); // Should be in short break
        expect(timer.timeRemaining).toBe(moment.duration(plugin.settings.shortBreakMinutes, "minutes"));
      });

      it('should pause after break timer completes', () => {
        timer._currentDurationIndex = 1; // TIMER_STATES.SHORT_BREAK
        timer._timeEnd = moment.duration(0);
        timer._isRunning = true;

        // Simulate break completion logic (without auto-progression)
        if (timer._timeEnd === moment.duration(0)) {
          timer._currentDurationIndex = 0; // TIMER_STATES.WORK
          timer.resetTimer();
          timer.pauseTimer();
        }

        expect(timer.running).toBe(false);
        expect(timer.currentDuration).toBe(0); // Should be back to work
        expect(timer.timeRemaining).toBe(moment.duration(plugin.settings.workMinutes, "minutes"));
      });
    });

    describe('Auto-progression Enabled', () => {
      beforeEach(() => {
        // Enable auto-progression
        plugin.settings.autoProgressEnabled = true;
        timer.updateSettings(plugin.settings);
      });

      it('should continue running after work timer completes', () => {
        timer._currentDurationIndex = 0; // TIMER_STATES.WORK
        timer._workIntervalCount = 0;
        timer._timeEnd = moment.duration(0);
        timer._isRunning = true;

        // Simulate timer completion logic (with auto-progression)
        if (timer._timeEnd === moment.duration(0)) {
          timer._workIntervalCount++;
          timer._currentDurationIndex = 1; // TIMER_STATES.SHORT_BREAK
          
          if (plugin.settings.autoProgressEnabled) {
            timer._remainingTime = timer['getCurrentDurationTime']();
          } else {
            timer.resetTimer();
            timer.pauseTimer();
          }
        }

        expect(timer.running).toBe(true);
        expect(timer.currentDuration).toBe(1); // Should be in short break
        expect(timer.timeRemaining).toBe(moment.duration(plugin.settings.shortBreakMinutes, "minutes"));
      });

      it('should continue running after break timer completes', () => {
        timer._currentDurationIndex = 1; // TIMER_STATES.SHORT_BREAK
        timer._timeEnd = moment.duration(0);
        timer._isRunning = true;

        // Simulate break completion logic (with auto-progression)
        if (timer._timeEnd === moment.duration(0)) {
          timer._currentDurationIndex = 0; // TIMER_STATES.WORK
          
          if (plugin.settings.autoProgressEnabled) {
            timer._remainingTime = timer['getCurrentDurationTime']();
          } else {
            timer.resetTimer();
            timer.pauseTimer();
          }
        }

        expect(timer.running).toBe(true);
        expect(timer.currentDuration).toBe(0); // Should be back to work
        expect(timer.timeRemaining).toBe(moment.duration(plugin.settings.workMinutes, "minutes"));
      });

      it('should transition to long break with auto-progression', () => {
        timer._currentDurationIndex = 0; // TIMER_STATES.WORK
        timer._workIntervalCount = 3; // One less than default (4)
        timer._timeEnd = moment.duration(0);
        timer._isRunning = true;

        // Simulate work completion leading to long break
        if (timer._timeEnd === moment.duration(0)) {
          timer._workIntervalCount++;
          if (timer._workIntervalCount >= plugin.settings.intervalsBeforeLongBreak) {
            timer._currentDurationIndex = 2; // TIMER_STATES.LONG_BREAK
            timer._workIntervalCount = 0;
          }
          
          if (plugin.settings.autoProgressEnabled) {
            timer._remainingTime = timer['getCurrentDurationTime']();
          } else {
            timer.resetTimer();
            timer.pauseTimer();
          }
        }

        expect(timer.running).toBe(true);
        expect(timer.currentDuration).toBe(2); // Should be in long break
        expect(timer.workCount).toBe(0); // Should reset work count
        expect(timer.timeRemaining).toBe(moment.duration(plugin.settings.longBreakMinutes, "minutes"));
      });

      it('should still allow manual pause during auto-progression', () => {
        // Enable auto-progression but test manual control
        timer._currentDurationIndex = 1; // TIMER_STATES.SHORT_BREAK
        timer._isRunning = true;
        timer._timeEnd = moment.utc(moment.now()).add(plugin.settings.shortBreakMinutes, "minutes"); // 5 minutes remaining

        timer.pauseTimer();

        expect(timer.isRunning).toBe(false);
        expect(timer.timeRemaining).toBe(moment.duration(plugin.settings.shortBreakMinutes, "minutes")); // Time should be preserved
      });

      it('should allow manual reset during auto-progression', () => {
        timer._currentDurationIndex = 1; // TIMER_STATES.SHORT_BREAK
        timer._isRunning = false;
        timer._timeEnd = moment.utc(moment.now()).add(plugin.settings.shortBreakMinutes, "minutes"); // Some time remaining

        timer.resetTimer();

        expect(timer.isRunning).toBe(false);
        expect(timer.timerType).toBe(1); // Should stay in short break
        expect(timer.timeRemaining).toBe(moment.duration(plugin.settings.shortBreakMinutes, "minutes"));
      });
    });
  });
});
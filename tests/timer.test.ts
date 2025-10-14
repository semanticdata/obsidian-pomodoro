/* eslint-disable @typescript-eslint/no-explicit-any */
import "./setup";
import PomodoroPlugin from "../src/main";
import { moment, App } from "obsidian";
import { PluginWithPrivates } from "./setup";
import { PomodoroTimer } from "../src/logic/timer";

describe("PomodoroTimer", () => {
	let plugin: PomodoroPlugin;
	let mockApp: App;
	let mockStatusBarItem: HTMLElement;

	beforeEach(async () => {
		// Reset mocks before each test
		jest.clearAllMocks();

		mockApp = {} as App; // Minimal App mock
		const manifest = {
			id: "test-plugin",
			name: "Test Plugin",
			version: "1.0.0",
			minAppVersion: "0.15.0",
			author: "Test Author",
			description: "Test Description",
		};

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

	describe("Timer Logic", () => {
		describe("Basic Timer Operations (with fake timers)", () => {
			beforeEach(() => {
				jest.useFakeTimers({ legacyFakeTimers: false });
				jest.setSystemTime(new Date());
			});

			afterEach(() => {
				jest.useRealTimers();
			});

			it("should start the timer and update display", () => {
				const timer = (plugin as PluginWithPrivates)._timer;

				timer.toggleTimer();
				expect(timer.isRunning).toBe(true);
				expect(mockStatusBarItem.classList.add).toHaveBeenCalledWith(
					"pomodoro-active",
				);
				expect(mockStatusBarItem.classList.remove).toHaveBeenCalledWith(
					"pomodoro-paused",
				);
				expect(window.setInterval).toHaveBeenCalledTimes(1);
			});

			it("should update display when timer counts down", () => {
				const now = Date.now();
				const timer = (plugin as PluginWithPrivates)._timer;

				// Set up querySelector to return text element
				const textEl: any = { textContent: "" };
				mockStatusBarItem.querySelector = jest
					.fn()
					.mockReturnValue(textEl);

				// Start the timer
				timer.toggleTimer();
				expect(timer.isRunning).toBe(true);

				// Advance the fake system time by 1 second and update display manually.
				const after = now + 1000;
				jest.setSystemTime(after);

				// Call updateDisplay to reflect the new time
				(timer as any).updateDisplay();

				// Should show 24:59 (25 minutes - 1 second)
				expect(textEl.textContent).toBe("24:59");

				// Clean up
				timer.pauseTimer();
			});
		});

		it("should pause the timer", () => {
			const timer = (plugin as PluginWithPrivates)._timer;

			// Clear previous classList calls from setup
			(mockStatusBarItem.classList.add as jest.Mock).mockClear();
			(mockStatusBarItem.classList.remove as jest.Mock).mockClear();

			timer.toggleTimer();
			timer.pauseTimer();
			expect(timer.isRunning).toBe(false);
			expect(mockStatusBarItem.classList.remove).toHaveBeenCalledWith(
				"pomodoro-active",
			);
			expect(mockStatusBarItem.classList.add).toHaveBeenCalledWith(
				"pomodoro-paused",
			);
			expect(window.clearInterval).toHaveBeenCalledTimes(1);
		});

		it("should reset the timer", () => {
			const timer = (plugin as PluginWithPrivates)._timer;
			timer.resetTimer();

			// After reset, timeRemaining should match the configured work duration
			expect(timer.timeRemaining.asMilliseconds()).toBeCloseTo(
				moment
					.duration(plugin.settings.workMinutes, "minutes")
					.asMilliseconds(),
			);
		});

		it("should cycle durations correctly", () => {
			const timer = (plugin as PluginWithPrivates)._timer;

			timer.cycleDuration();
			expect(timer.timerType).toBe(1); // Short break

			timer.cycleDuration();
			expect(timer.timerType).toBe(2); // Long break

			timer.cycleDuration();
			expect(timer.timerType).toBe(0); // Work
		});

		it("should not cycle duration when timer is running", () => {
			const timer = (plugin as PluginWithPrivates)._timer;

			timer.toggleTimer();
			const initialTimerType = timer.timerType;
			timer.cycleDuration();

			expect(timer.timerType).toBe(initialTimerType);
			timer.pauseTimer();
		});
	});

	describe("resetToWorkState Method", () => {
		it("should reset timer to work state and pause", () => {
			const timer = (plugin as PluginWithPrivates)._timer;

			// Set timer to different state
			timer["currentDurationIndex"] = 2; // Long break
			timer["workIntervalCount"] = 3;
			timer.toggleTimer();

			// Call resetToWorkState (covers lines 191-194)
			timer.resetToWorkState();

			expect(timer["currentDurationIndex"]).toBe(0); // Work state
			expect(timer["workIntervalCount"]).toBe(0); // Reset count
			expect(timer.isRunning).toBe(false); // Should be paused
			// Compare durations numerically to avoid 1ms differences from timing
			expect(timer.timeRemaining.asMilliseconds()).toBeCloseTo(
				moment
					.duration(plugin.settings.workMinutes, "minutes")
					.asMilliseconds(),
				-2,
			); // Work duration
		});

		it("should reset to work state even when already in work state", () => {
			const timer = (plugin as PluginWithPrivates)._timer;

			// Already in work state but with some progress
			timer["currentDurationIndex"] = 0; // Work state
			timer["workIntervalCount"] = 2;
			timer["timeEnd"] = moment.utc(moment.now()).add(500, "seconds"); // Some progress made

			timer.resetToWorkState();

			expect(timer["currentDurationIndex"]).toBe(0); // Still work state
			expect(timer["workIntervalCount"]).toBe(0); // Reset count
			expect(timer.timeRemaining.asMilliseconds()).toBeCloseTo(
				moment
					.duration(plugin.settings.workMinutes, "minutes")
					.asMilliseconds(),
				-2,
			); // Reset duration
		});
	});

	describe("Edge Cases", () => {
		describe("Negative Duration Display (with fake timers)", () => {
			beforeEach(() => {
				jest.useFakeTimers({ legacyFakeTimers: false });
				jest.setSystemTime(Date.now());
			});

			afterEach(() => {
				jest.useRealTimers();
			});

			it("should handle negative duration display (timer overflow)", () => {
				const now = Date.now();
				const timer = (plugin as PluginWithPrivates)._timer;

				// Set up querySelector to return text element
				const textEl: any = { textContent: "" };
				mockStatusBarItem.querySelector = jest
					.fn()
					.mockReturnValue(textEl);

				// Start the timer
				timer.toggleTimer();
				expect(timer.isRunning).toBe(true);

				// Advance time beyond the timer duration to create negative duration
				// Default work time is 25 minutes (1500 seconds)
				const overflowTime = 1500000 + 30000; // 25 minutes + 30 seconds
				jest.setSystemTime(now + overflowTime);

				// Call updateDisplay to reflect the negative time
				(timer as any).updateDisplay();

				// Current behavior: shows 0:-30 (negative on seconds component)
				// This documents the current formatting behavior for negative durations
				expect(textEl.textContent).toBe("0:-30");

				// Clean up
				timer.pauseTimer();
			});

			it("should format negative minutes correctly", () => {
				const now = Date.now();
				const timer = (plugin as PluginWithPrivates)._timer;

				const textEl: any = { textContent: "" };
				mockStatusBarItem.querySelector = jest
					.fn()
					.mockReturnValue(textEl);

				timer.toggleTimer();

				// Advance time to create -2 minutes and 15 seconds overflow
				const overflowTime = 1500000 + 135000; // 25 minutes + 2 minutes 15 seconds
				jest.setSystemTime(now + overflowTime);

				(timer as any).updateDisplay();

				// Current behavior: shows -2:-15 (negative on both components)
				// This documents the current formatting behavior for negative durations
				expect(textEl.textContent).toBe("-2:-15");

				timer.pauseTimer();
			});
		});

		it("should handle missing text element in updateDisplay", () => {
			const timer = (plugin as PluginWithPrivates)._timer;
			mockStatusBarItem.querySelector = jest.fn().mockReturnValue(null);

			// Should not throw error and should not change remaining time
			const beforeMs = timer.timeRemaining.asMilliseconds();
			expect(() => timer["updateDisplay"]()).not.toThrow();
			expect(timer.timeRemaining.asMilliseconds()).toBeCloseTo(
				beforeMs,
				-2,
			);
		});

		it("should handle missing icon element in updateIconVisibility", () => {
			const timer = (plugin as PluginWithPrivates)._timer;
			mockStatusBarItem.querySelector = jest.fn().mockReturnValue(null);

			// Should not throw error and should preserve class list when icon element is missing
			const beforeClasses = Array.from(mockStatusBarItem.classList);
			expect(() => timer.updateSettings(plugin.settings)).not.toThrow();
			expect(Array.from(mockStatusBarItem.classList)).toEqual(
				beforeClasses,
			);
		});

		it("should handle cleanup with multiple registered intervals", () => {
			const timer = (plugin as PluginWithPrivates)._timer;
			const clearIntervalSpy = jest.spyOn(window, "clearInterval");

			// Simulate multiple intervals being registered
			timer["registeredIntervals"] = new Set([1, 2, 3]);

			timer.cleanup();

			expect(clearIntervalSpy).toHaveBeenCalledWith(1);
			expect(clearIntervalSpy).toHaveBeenCalledWith(2);
			expect(clearIntervalSpy).toHaveBeenCalledWith(3);
			expect(timer["registeredIntervals"].size).toBe(0);

			clearIntervalSpy.mockRestore();
		});

		it("should handle cleanup with no registered intervals", () => {
			const timer = (plugin as PluginWithPrivates)._timer;
			const clearIntervalSpy = jest.spyOn(window, "clearInterval");

			// Ensure no intervals are registered
			timer["registeredIntervals"] = new Set();

			// Should not throw and should not call clearInterval; internal state should remain cleared
			expect(() => timer.cleanup()).not.toThrow();
			expect(clearIntervalSpy).not.toHaveBeenCalled();
			expect(timer["registeredIntervals"].size).toBe(0);
			expect(timer["currentInterval"]).toBeNull();

			clearIntervalSpy.mockRestore();
		});
	});

	describe("Mouse Event Handling", () => {
		let timer: PomodoroTimer;

		beforeEach(() => {
			timer = (plugin as PluginWithPrivates)._timer;
		});

		/**
		 * Helper to find a registered DOM event handler by event name
		 */
		function findEventHandler(eventName: string) {
			const handler = (plugin as any).domEventHandlers.find(
				(call: any) => call.event === eventName,
			);
			return handler ? handler.callback : null;
		}

		describe("Left Click Events", () => {
			it("should toggle timer on left click", () => {
				expect(timer.isRunning).toBe(false);

				const toggleTimerSpy = jest.spyOn(timer, "toggleTimer");
				const clickHandler = findEventHandler("click");

				expect(clickHandler).toBeDefined();

				// Simulate left click (button: 0)
				const clickEvent = { button: 0 } as MouseEvent;
				clickHandler(clickEvent);

				expect(toggleTimerSpy).toHaveBeenCalled();
			});

			it("should start timer when clicked while not running", () => {
				expect(timer.isRunning).toBe(false);

				const clickHandler = findEventHandler("click");
				const clickEvent = { button: 0 } as MouseEvent;
				clickHandler(clickEvent);

				expect(timer.isRunning).toBe(true);
			});

			it("should pause timer when clicked while running", () => {
				// Start timer first
				timer.toggleTimer();
				expect(timer.isRunning).toBe(true);

				const clickHandler = findEventHandler("click");
				const clickEvent = { button: 0 } as MouseEvent;
				clickHandler(clickEvent);

				expect(timer.isRunning).toBe(false);
			});
		});

		describe("Middle Click Events", () => {
			it("should cycle duration on middle click when not running", () => {
				expect(timer.isRunning).toBe(false);
				const initialTimerType = timer.timerType;

				const auxclickHandler = findEventHandler("auxclick");
				expect(auxclickHandler).toBeDefined();

				// Simulate middle click (button: 1)
				const auxclickEvent = { button: 1 } as MouseEvent;
				auxclickHandler(auxclickEvent);

				// Timer type should have cycled
				expect(timer.timerType).not.toBe(initialTimerType);
			});

			it("should attempt to cycle duration even when running", () => {
				// Note: cycleDuration checks isRunning internally and returns early if running
				// But the event handler doesn't prevent calling it
				timer.toggleTimer();
				expect(timer.isRunning).toBe(true);

				const cycleDurationSpy = jest.spyOn(timer, "cycleDuration");
				const auxclickHandler = findEventHandler("auxclick");

				const auxclickEvent = { button: 1 } as MouseEvent;
				auxclickHandler(auxclickEvent);

				// cycleDuration is called but does nothing when timer is running
				expect(cycleDurationSpy).toHaveBeenCalled();
			});
		});

		describe("Right Click Events", () => {
			it("should reset timer on right click when not running", () => {
				expect(timer.isRunning).toBe(false);

				const resetTimerSpy = jest.spyOn(timer, "resetTimer");
				const contextmenuHandler = findEventHandler("contextmenu");

				expect(contextmenuHandler).toBeDefined();

				const contextmenuEvent = {
					preventDefault: jest.fn(),
				} as unknown as MouseEvent;

				contextmenuHandler(contextmenuEvent);

				expect(contextmenuEvent.preventDefault).toHaveBeenCalled();
				expect(resetTimerSpy).toHaveBeenCalled();
			});

			it("should not reset timer on right click when running", () => {
				timer.toggleTimer();
				expect(timer.isRunning).toBe(true);

				const resetTimerSpy = jest.spyOn(timer, "resetTimer");
				const contextmenuHandler = findEventHandler("contextmenu");

				const contextmenuEvent = {
					preventDefault: jest.fn(),
				} as unknown as MouseEvent;

				contextmenuHandler(contextmenuEvent);

				// Context menu is prevented but timer is not reset
				expect(contextmenuEvent.preventDefault).toHaveBeenCalled();
				expect(resetTimerSpy).not.toHaveBeenCalled();
			});

			it("should always prevent default context menu", () => {
				const contextmenuHandler = findEventHandler("contextmenu");

				const contextmenuEvent = {
					preventDefault: jest.fn(),
				} as unknown as MouseEvent;

				contextmenuHandler(contextmenuEvent);

				expect(contextmenuEvent.preventDefault).toHaveBeenCalled();
			});
		});
	});

	describe("Icon State Transitions", () => {
		let timer: PomodoroTimer;

		beforeEach(async () => {
			await plugin.onload();
			timer = (plugin as PluginWithPrivates)._timer;
		});

		it("should show timer icon when at default duration", () => {
			// Timer starts at default duration
			expect(timer._isAtDefaultDuration()).toBe(true);

			const statusBarItem = (plugin as PluginWithPrivates)._statusBarItem;
			const iconContainer = statusBarItem.querySelector(".pomodoro-icon");

			// Should have timer icon-off since timer starts disabled (timeEnd === null)
			expect(iconContainer).toBeDefined();
			expect(iconContainer?.getAttribute("data-icon-key")).toBe(
				"pomobar-timer-off",
			);
		});

		it("should show pause icon when running", () => {
			timer.toggleTimer();
			expect(timer.isRunning).toBe(true);

			const statusBarItem = (plugin as PluginWithPrivates)._statusBarItem;
			const iconContainer = statusBarItem.querySelector(".pomodoro-icon");

			// Should have pause icon key
			expect(iconContainer).toBeDefined();
			expect(iconContainer?.getAttribute("data-icon-key")).toBe(
				"pomobar-timer-pause",
			);
		});

		describe("Paused Mid-Session Icon (with fake timers)", () => {
			beforeEach(() => {
				jest.useFakeTimers({ legacyFakeTimers: false });
				jest.setSystemTime(Date.now());
			});

			afterEach(() => {
				jest.useRealTimers();
			});

			it("should show play icon when paused mid-session", () => {
				// Start timer
				timer.toggleTimer();
				expect(timer.isRunning).toBe(true);

				// Advance time by 1 second
				jest.advanceTimersByTime(1000);
				(timer as any).updateDisplay(); // Manually trigger update

				// Pause the timer
				timer.pauseTimer();

				expect(timer.isRunning).toBe(false);
				expect(timer._isAtDefaultDuration()).toBe(false); // No longer at default duration

				const statusBarItem = (
					plugin as PluginWithPrivates
				)._statusBarItem;
				const iconContainer =
					statusBarItem.querySelector(".pomodoro-icon");

				expect(iconContainer).toBeDefined();
				// Should have play icon key when paused mid-session
				expect(iconContainer?.getAttribute("data-icon-key")).toBe(
					"pomobar-timer-play",
				);
			});
		});

		it("should update icon when cycling durations", () => {
			const initialDuration = timer.timerType;

			timer.cycleDuration();

			expect(timer.timerType).not.toBe(initialDuration);

			const statusBarItem = (plugin as PluginWithPrivates)._statusBarItem;
			const iconContainer = statusBarItem.querySelector(".pomodoro-icon");

			expect(iconContainer).toBeDefined();
			// Icon key should reflect the (possibly cycled) state
			expect([
				"pomobar-timer",
				"pomobar-timer-play",
				"pomobar-timer-pause",
				"pomobar-timer-off",
			]).toContain(iconContainer?.getAttribute("data-icon-key"));
		});
	});

	describe("Timer Completion Flow", () => {
		let timer: PomodoroTimer;

		beforeEach(async () => {
			await plugin.onload();
			timer = (plugin as PluginWithPrivates)._timer;

			// Mock the Notice constructor
			jest.clearAllMocks();
		});

		it("should transition from work to short break", () => {
			// Set up work timer
			timer._currentDurationIndex = 0; // TIMER_STATES.WORK
			timer._workIntervalCount = 0;

			// Mock timer completion
			timer._timeEnd = moment.duration(0);
			timer._isRunning = true;

			const initialWorkCount = timer.workIntervalsCount;

			// Simulate timer reaching zero (this would normally happen in the interval)
			// We need to trigger the timer completion logic manually since we can't wait for intervals
			timer.advanceTimer();
			timer.pauseTimer();

			expect(timer.workIntervalsCount).toBe(initialWorkCount + 1);
			expect(timer.timerType).toBe(1); // Should be in short break
		});

		it("should transition to long break after configured work intervals", () => {
			// Set up for long break transition
			timer._currentDurationIndex = 0; // TIMER_STATES.WORK
			timer._workIntervalCount = 3; // One less than default intervalsBeforeLongBreak (4)

			timer._timeEnd = moment.duration(0);
			timer._isRunning = true;

			// Simulate timer completion leading to long break
			timer.advanceTimer();
			timer.pauseTimer();

			expect(timer.timerType).toBe(2); // Should be in long break
			expect(timer.workIntervalsCount).toBe(0); // Should reset work count
		});

		it("should transition from break back to work", () => {
			// Set up break timer
			timer._currentDurationIndex = 1; // TIMER_STATES.SHORT_BREAK

			timer._timeEnd = moment.duration(0);
			timer._isRunning = true;

			// Simulate break completion
			timer.advanceTimer();
			timer.pauseTimer();

			expect(timer.timerType).toBe(0); // Should be back to work
		});
	});

	describe("Auto-progression Feature", () => {
		let timer: PomodoroTimer;

		beforeEach(async () => {
			await plugin.onload();
			timer = (plugin as PluginWithPrivates)._timer;
			jest.clearAllMocks();
		});

		describe("Auto-progression Disabled (Default Behavior)", () => {
			beforeEach(() => {
				// Ensure auto-progression is disabled (default)
				plugin.settings.autoProgressEnabled = false;
				timer.updateSettings(plugin.settings);
			});

			it("should pause after work timer completes", () => {
				timer._currentDurationIndex = 0; // TIMER_STATES.WORK
				timer._workIntervalCount = 0;
				timer._timeEnd = moment.duration(0);
				timer._isRunning = true;

				// Simulate timer completion logic (without auto-progression)
				timer.advanceTimer();
				timer.pauseTimer();

				expect(timer.isRunning).toBe(false);
				expect(timer.timerType).toBe(1); // Should be in short break
				expect(timer.timeRemaining.asMilliseconds()).toBeCloseTo(
					moment
						.duration(plugin.settings.shortBreakMinutes, "minutes")
						.asMilliseconds(),
					-2,
				);
			});

			it("should pause after break timer completes", () => {
				timer._currentDurationIndex = 1; // TIMER_STATES.SHORT_BREAK
				timer._timeEnd = moment.duration(0);
				timer._isRunning = true;

				// Simulate break completion logic (without auto-progression)
				timer.advanceTimer();
				timer.pauseTimer();

				expect(timer.isRunning).toBe(false);
				expect(timer.timerType).toBe(0); // Should be back to work
				expect(timer.timeRemaining.asMilliseconds()).toBeCloseTo(
					moment
						.duration(plugin.settings.workMinutes, "minutes")
						.asMilliseconds(),
					-2,
				);
			});
		});

		describe("Auto-progression Enabled", () => {
			beforeEach(() => {
				// Enable auto-progression
				plugin.settings.autoProgressEnabled = true;
				timer.updateSettings(plugin.settings);
			});

			it("should continue running after work timer completes", () => {
				timer._currentDurationIndex = 0; // TIMER_STATES.WORK
				timer._workIntervalCount = 0;
				timer._timeEnd = moment.duration(0);
				timer._isRunning = true;

				// Simulate timer completion logic (with auto-progression)
				timer.advanceTimer();

				expect(timer.isRunning).toBe(true);
				expect(timer.timerType).toBe(1); // Should be in short break
				expect(timer.timeRemaining.asMilliseconds()).toBeCloseTo(
					moment
						.duration(plugin.settings.shortBreakMinutes, "minutes")
						.asMilliseconds(),
					-2,
				);
			});

			it("should continue running after break timer completes", () => {
				timer._currentDurationIndex = 1; // TIMER_STATES.SHORT_BREAK
				timer._timeEnd = moment.duration(0);
				timer._isRunning = true;

				// Simulate break completion logic (with auto-progression)
				timer.advanceTimer();

				expect(timer.isRunning).toBe(true);
				expect(timer.timerType).toBe(0); // Should be back to work
				expect(timer.timeRemaining.asMilliseconds()).toBeCloseTo(
					moment
						.duration(plugin.settings.workMinutes, "minutes")
						.asMilliseconds(),
					-2,
				);
			});

			it("should transition to long break with auto-progression", () => {
				timer._currentDurationIndex = 0; // TIMER_STATES.WORK
				timer._workIntervalCount = 3; // One less than default (4)
				timer._timeEnd = moment.duration(0);
				timer._isRunning = true;

				// Simulate work completion leading to long break
				timer.advanceTimer();

				expect(timer.isRunning).toBe(true);
				expect(timer.timerType).toBe(2); // Should be in long break
				expect(timer.workIntervalsCount).toBe(0); // Should reset work count
				expect(timer.timeRemaining.asMilliseconds()).toBeCloseTo(
					moment
						.duration(plugin.settings.longBreakMinutes, "minutes")
						.asMilliseconds(),
					-2,
				);
			});

			it("should still allow manual pause during auto-progression", () => {
				// Enable auto-progression but test manual control
				timer._currentDurationIndex = 1; // TIMER_STATES.SHORT_BREAK
				timer._isRunning = true;
				timer._timeEnd = moment
					.utc(moment.now())
					.add(plugin.settings.shortBreakMinutes, "minutes"); // 5 minutes remaining

				timer.pauseTimer();

				expect(timer.isRunning).toBe(false);
				expect(timer.timeRemaining.asMilliseconds()).toBeCloseTo(
					moment
						.duration(plugin.settings.shortBreakMinutes, "minutes")
						.asMilliseconds(),
					-2,
				); // Time should be preserved
			});

			it("should allow manual reset during auto-progression", () => {
				timer._currentDurationIndex = 1; // TIMER_STATES.SHORT_BREAK
				timer._isRunning = false;
				timer._timeEnd = moment
					.utc(moment.now())
					.add(plugin.settings.shortBreakMinutes, "minutes"); // Some time remaining

				timer.resetTimer();

				expect(timer.isRunning).toBe(false);
				expect(timer.timerType).toBe(1); // Should stay in short break
				expect(timer.timeRemaining.asMilliseconds()).toBeCloseTo(
					moment
						.duration(plugin.settings.shortBreakMinutes, "minutes")
						.asMilliseconds(),
					-2,
				);
			});
		});
	});
});

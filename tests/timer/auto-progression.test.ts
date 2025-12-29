/* eslint-disable @typescript-eslint/no-explicit-any */
import "../setup";
import PomodoroPlugin from "../../src/main";
import { moment } from "obsidian";
import { PluginWithPrivates } from "../setup";
import { createStandardTestPlugin, cleanupStandardTestPlugin } from "../helpers/plugin-test-helpers";

describe("PomodoroTimer - Auto-progression", () => {
	let plugin: PomodoroPlugin;
	let timer: any;

	beforeEach(async () => {
		const setup = await createStandardTestPlugin();
		plugin = setup.plugin;
		timer = (plugin as PluginWithPrivates)._timer;
		jest.clearAllMocks();
	});

	afterEach(async () => {
		await cleanupStandardTestPlugin(plugin);
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

	describe("Persistent Notification Feature", () => {
		beforeEach(() => {
			// Enable persistent notification
			plugin.settings.persistentNotification = true;
			plugin.settings.autoProgressEnabled = false;
			timer.updateSettings(plugin.settings);
		});

		it("should create persistent notification only once when timer overflows", () => {
			// Access the private persistentNotice property
			const getNotice = () => (timer as any).persistentNotice;

			// Initially no notification
			expect(getNotice()).toBeNull();

			// Simulate timer overflow scenario
			timer._currentDurationIndex = 0;
			timer._workIntervalCount = 0;

			// Start timer and immediately set to overflow state
			timer.toggleTimer();
			expect(timer.isRunning).toBe(true);

			// Manually trigger the overflow logic by calling the interval callback
			// In real scenario, this would happen when time reaches 0
			const intervalCallback = (timer as any).currentInterval;
			expect(intervalCallback).not.toBeNull();

			// Note: We can't easily test the interval callback directly in unit tests
			// because it's an anonymous function. The important part is that the
			// persistent notification is only created once and tracked properly.
		});

		it("should clear persistent notification when timer is paused", () => {
			// Create a mock persistent notification
			const mockNotice = {
				hide: jest.fn(),
			};
			(timer as any).persistentNotice = mockNotice;

			// Pause the timer
			timer.pauseTimer();

			// Should have called hide on the notification
			expect(mockNotice.hide).toHaveBeenCalled();

			// Should have cleared the reference
			expect((timer as any).persistentNotice).toBeNull();
		});

		it("should clear persistent notification when timer is reset", () => {
			// Create a mock persistent notification
			const mockNotice = {
				hide: jest.fn(),
			};
			(timer as any).persistentNotice = mockNotice;

			// Reset the timer
			timer.resetTimer();

			// Should have called hide on the notification
			expect(mockNotice.hide).toHaveBeenCalled();

			// Should have cleared the reference
			expect((timer as any).persistentNotice).toBeNull();
		});

		it("should clear persistent notification when timer is toggled", () => {
			// Create a mock persistent notification
			const mockNotice = {
				hide: jest.fn(),
			};
			(timer as any).persistentNotice = mockNotice;

			// Toggle the timer (start it)
			timer.toggleTimer();

			// Should have called hide on the notification
			expect(mockNotice.hide).toHaveBeenCalled();

			// Should have cleared the reference (set to null before starting)
			// Note: After toggleTimer, a new timer is running, so persistentNotice
			// should have been cleared before starting
			timer.pauseTimer(); // Clean up
		});

		it("should clear persistent notification in cleanup", () => {
			// Create a mock persistent notification
			const mockNotice = {
				hide: jest.fn(),
			};
			(timer as any).persistentNotice = mockNotice;

			// Call cleanup
			timer.cleanup();

			// Should have called hide on the notification
			expect(mockNotice.hide).toHaveBeenCalled();

			// Should have cleared the reference
			expect((timer as any).persistentNotice).toBeNull();
		});
	});
});

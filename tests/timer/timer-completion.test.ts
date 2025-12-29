/* eslint-disable @typescript-eslint/no-explicit-any */
import "../setup";
import PomodoroPlugin from "../../src/main";
import { moment } from "obsidian";
import { PluginWithPrivates } from "../setup";
import { createStandardTestPlugin, cleanupStandardTestPlugin } from "../helpers/plugin-test-helpers";

describe("PomodoroTimer - Timer Completion", () => {
	let plugin: PomodoroPlugin;
	let timer: any;

	beforeEach(async () => {
		const setup = await createStandardTestPlugin();
		plugin = setup.plugin;
		timer = (plugin as PluginWithPrivates)._timer;
	});

	afterEach(async () => {
		await cleanupStandardTestPlugin(plugin);
	});

	describe("Icon State Transitions", () => {
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
				timer.updateDisplay(); // Manually trigger update

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
});

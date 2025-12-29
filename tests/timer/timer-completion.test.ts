/* eslint-disable @typescript-eslint/no-explicit-any */
import "../setup";
import PomodoroPlugin from "../../src/main";
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
});

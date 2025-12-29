/* eslint-disable @typescript-eslint/no-explicit-any */
import "../setup";
import PomodoroPlugin from "../../src/main";
import { moment, App } from "obsidian";
import { PluginWithPrivates } from "../setup";

describe("PomodoroTimer - Basic Operations", () => {
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

		it("should format positive time with consistent MM:SS format", () => {
			const now = Date.now();
			const timer = (plugin as PluginWithPrivates)._timer;

			const textEl: any = { textContent: "" };
			mockStatusBarItem.querySelector = jest
				.fn()
				.mockReturnValue(textEl);

			timer.toggleTimer();

			// Test various positive times to ensure consistent formatting
			const testCases = [
				{ offset: 0, expected: "25:00" }, // Full time
				{ offset: 1000, expected: "24:59" }, // 1 second elapsed
				{ offset: 60000, expected: "24:00" }, // 1 minute elapsed
				{ offset: 9000, expected: "24:51" }, // 9 seconds elapsed
				{ offset: 599000, expected: "15:01" }, // 9:59 elapsed
				{ offset: 1494000, expected: "0:06" }, // Almost done
			];

			testCases.forEach(({ offset, expected }) => {
				jest.setSystemTime(now + offset);
				(timer as any).updateDisplay();
				expect(textEl.textContent).toBe(expected);
			});

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
});

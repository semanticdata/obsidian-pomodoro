/* eslint-disable @typescript-eslint/no-explicit-any */
import "../setup";
import PomodoroPlugin from "../../src/main";
import { PluginWithPrivates } from "../setup";
import { createStandardTestPlugin, cleanupStandardTestPlugin } from "../helpers/plugin-test-helpers";

describe("PomodoroTimer - Edge Cases", () => {
	let plugin: PomodoroPlugin;
	let mockStatusBarItem: HTMLElement;

	beforeEach(async () => {
		const setup = await createStandardTestPlugin();
		plugin = setup.plugin;
		mockStatusBarItem = (plugin as PluginWithPrivates)._statusBarItem;
	});

	afterEach(async () => {
		await cleanupStandardTestPlugin(plugin);
	});

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

			// Fixed behavior: shows -0:30 (proper negative formatting)
			expect(textEl.textContent).toBe("-0:30");

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

			// Fixed behavior: shows -2:15 (proper negative formatting)
			expect(textEl.textContent).toBe("-2:15");

			timer.pauseTimer();
		});

		it("should format negative time with consistent -MM:SS format", () => {
			const now = Date.now();
			const timer = (plugin as PluginWithPrivates)._timer;

			const textEl: any = { textContent: "" };
			mockStatusBarItem.querySelector = jest
				.fn()
				.mockReturnValue(textEl);

			timer.toggleTimer();

			// Test various negative times to ensure consistent formatting
			const testCases = [
				{ offset: 1500000 + 1000, expected: "-0:01" }, // 1 second over
				{ offset: 1500000 + 5000, expected: "-0:05" }, // 5 seconds over
				{ offset: 1500000 + 60000, expected: "-1:00" }, // 1 minute over
				{ offset: 1500000 + 65000, expected: "-1:05" }, // 1:05 over
				{ offset: 1500000 + 600000, expected: "-10:00" }, // 10 minutes over
				{ offset: 1500000 + 3599000, expected: "-59:59" }, // 59:59 over
			];

			testCases.forEach(({ offset, expected }) => {
				jest.setSystemTime(now + offset);
				(timer as any).updateDisplay();
				expect(textEl.textContent).toBe(expected);
			});

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

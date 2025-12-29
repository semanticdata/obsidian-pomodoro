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

	it("should handle cleanup with registered intervals", () => {
		const timer = (plugin as PluginWithPrivates)._timer;
		const clearIntervalSpy = jest.spyOn(window, "clearInterval");

		// Test with multiple intervals
		timer["registeredIntervals"] = new Set([1, 2, 3]);
		timer.cleanup();

		expect(clearIntervalSpy).toHaveBeenCalledWith(1);
		expect(clearIntervalSpy).toHaveBeenCalledWith(2);
		expect(clearIntervalSpy).toHaveBeenCalledWith(3);
		expect(timer["registeredIntervals"].size).toBe(0);

		// Test with no intervals
		timer["registeredIntervals"] = new Set();
		expect(() => timer.cleanup()).not.toThrow();
		expect(clearIntervalSpy).toHaveBeenCalledTimes(3); // No additional calls
		expect(timer["registeredIntervals"].size).toBe(0);
		expect(timer["currentInterval"]).toBeNull();

		clearIntervalSpy.mockRestore();
	});
});

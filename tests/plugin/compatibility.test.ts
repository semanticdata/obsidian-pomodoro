import "../setup";
import PomodoroPlugin from "../../src/main";
import { App } from "obsidian";
import { PluginWithPrivates } from "../setup";

describe("PomodoroPlugin - Compatibility", () => {
	let plugin: PomodoroPlugin;
	let mockApp: App;

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

	describe("Compatibility Properties", () => {
		it("should provide currentDurationIndex getter that delegates to timer", () => {
			// This getter provides backward compatibility by delegating to timer.timerType
			expect(plugin.currentDurationIndex).toBe(0);

			// Verify it reflects timer state
			const timer = (plugin as PluginWithPrivates)._timer;
			expect(plugin.currentDurationIndex).toBe(timer.timerType);
		});

		it("should provide workIntervalCount getter that delegates to timer", () => {
			// This getter provides backward compatibility by delegating to timer.workIntervalsCount
			expect(plugin.workIntervalCount).toBe(0);

			// Verify it reflects timer state
			const timer = (plugin as PluginWithPrivates)._timer;
			expect(plugin.workIntervalCount).toBe(timer.workIntervalsCount);
		});

		it("should provide resetTimer method that delegates to timer", () => {
			const timer = (plugin as PluginWithPrivates)._timer;
			const resetTimerSpy = jest.spyOn(timer, "resetTimer");

			plugin.resetTimer();

			expect(resetTimerSpy).toHaveBeenCalled();
		});

		it("should provide resetPomodoroSession method that resets to work state", () => {
			const timer = (plugin as PluginWithPrivates)._timer;
			const resetToWorkStateSpy = jest.spyOn(timer, "resetToWorkState");

			plugin.resetPomodoroSession();

			expect(resetToWorkStateSpy).toHaveBeenCalled();
		});

		it("should safely handle resetTimer when timer is not initialized", () => {
			// Create a plugin without calling onload (no timer initialized)
			const uninitializedPlugin = new PomodoroPlugin({} as App, {
				id: "test",
				name: "Test",
				version: "1.0.0",
				minAppVersion: "0.15.0",
				author: "Test",
				description: "Test",
			});

			// Should not throw when timer is undefined
			expect(() => {
				uninitializedPlugin.resetTimer();
			}).not.toThrow();

			// Timer remains undefined after call
			expect(
				(uninitializedPlugin as PluginWithPrivates)._timer,
			).toBeUndefined();
		});
	});
});

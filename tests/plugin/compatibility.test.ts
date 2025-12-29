import "../setup";
import PomodoroPlugin from "../../src/main";
import { PluginWithPrivates } from "../setup";
import { createStandardTestPlugin, cleanupStandardTestPlugin, createUninitializedTestPlugin } from "../helpers/plugin-test-helpers";

describe("PomodoroPlugin - Compatibility", () => {
	let plugin: PomodoroPlugin;

	beforeEach(async () => {
		const setup = await createStandardTestPlugin();
		plugin = setup.plugin;
	});

	afterEach(async () => {
		await cleanupStandardTestPlugin(plugin);
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
			const uninitializedPlugin = createUninitializedTestPlugin();

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

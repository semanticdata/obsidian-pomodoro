import "../setup";
import PomodoroPlugin from "../../src/main";
import { moment, App } from "obsidian";
import { PluginWithPrivates } from "../setup";

describe("PomodoroPlugin - Lifecycle", () => {
	let plugin: PomodoroPlugin;
	let mockApp: App;

	beforeEach(() => {
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

		// The mocked 'obsidian' module's Plugin class will provide mocks for these:
		// addStatusBarItem, registerDomEvent, registerInterval, loadData, saveData
		// We might need to spy on them if we want to check if they were called with specific args.
		// For loadData, we can re-mock it per test if specific return values are needed.
		plugin.loadData = jest.fn().mockResolvedValue({});
		plugin.saveData = jest.fn().mockResolvedValue(undefined);
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

	describe("Initialization and Settings", () => {
		it("should load default settings on onload if no saved data", async () => {
			await plugin.onload();
			expect(plugin.settings.workMinutes).toBe(25);
			expect(plugin.settings.shortBreakMinutes).toBe(5);
			expect(plugin.settings.longBreakMinutes).toBe(15);
			expect(plugin.settings.intervalsBeforeLongBreak).toBe(4);
			expect((plugin as PluginWithPrivates)._statusBarItem).toBeDefined();
		});

		it("should load saved settings on onload", async () => {
			const savedSettings = {
				workMinutes: 30,
				shortBreakMinutes: 7,
				longBreakMinutes: 20,
				intervalsBeforeLongBreak: 3,
			};
			plugin.loadData = jest.fn().mockResolvedValue(savedSettings);
			await plugin.onload();
			// Settings should include the saved values plus defaults
			expect(plugin.settings).toEqual({
				...savedSettings,
				showIcon: false, // Default value
				showInStatusBar: true, // Default value
				soundEnabled: false, // Default value
				persistentNotification: false, // Default value
				selectedSound: "chime.wav", // Default value
				soundVolume: 0.5, // Default value
				autoProgressEnabled: false, // Default value
			});
		});

		it("should migrate old settings schema to new schema", async () => {
			const oldSettings = {
				workTime: 30,
				shortBreakTime: 7,
				longBreakTime: 20,
				intervalsBeforeLongBreak: 3,
			};
			plugin.loadData = jest.fn().mockResolvedValue(oldSettings);
			plugin.saveData = jest.fn().mockResolvedValue(undefined);

			await plugin.onload();

			// Should have called saveData to persist migrated settings
			expect(plugin.saveData).toHaveBeenCalledWith({
				workMinutes: 30,
				shortBreakMinutes: 7,
				longBreakMinutes: 20,
				intervalsBeforeLongBreak: 3,
			});

			// Settings should use new property names
			expect(plugin.settings.workMinutes).toBe(30);
			expect(plugin.settings.shortBreakMinutes).toBe(7);
			expect(plugin.settings.longBreakMinutes).toBe(20);
			expect(plugin.settings).not.toHaveProperty("workTime");
			expect(plugin.settings).not.toHaveProperty("shortBreakTime");
			expect(plugin.settings).not.toHaveProperty("longBreakTime");
		});
	});

	describe("Plugin Lifecycle", () => {
		it("should add settings tab on load", async () => {
			const addSettingTabSpy = jest.spyOn(plugin, "addSettingTab");
			await plugin.onload();
			expect(addSettingTabSpy).toHaveBeenCalledWith(expect.any(Object));
		});

		it("should initialize timer with correct default duration", async () => {
			await plugin.onload();
			const timer = (plugin as PluginWithPrivates)._timer;

			// Fixed: Use asSeconds() instead of seconds() to get total seconds
			// seconds() only returns seconds within the current minute (0-59)
			// asSeconds() returns the total duration in seconds
			const expectedDurationSeconds = moment
				.duration(plugin.settings.workMinutes, "minutes")
				.asSeconds();
			const actualDurationSeconds = timer.timeRemaining.asSeconds();

			expect(actualDurationSeconds).toBe(expectedDurationSeconds);
			expect(timer.isRunning).toBe(false);
			expect(timer.timerType).toBe(0); // Work state
			expect(timer.workIntervalsCount).toBe(0);
		});
	});
});

import "./setup";
import PomodoroPlugin from "../src/main";
import { moment, App } from "obsidian";
import { PluginWithPrivates } from "./setup";

describe("PomodoroPlugin", () => {
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

	describe("Compatibility Properties", () => {
		beforeEach(async () => {
			await plugin.onload();
		});

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

	describe("Settings Management", () => {
		beforeEach(async () => {
			await plugin.onload();
		});

		it("should save settings", async () => {
			plugin.settings.workMinutes = 30;
			await plugin.saveSettings();
			expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
		});

		it("should save settings and update timer", async () => {
			const timer = (plugin as PluginWithPrivates)._timer;
			const updateSettingsSpy = jest.spyOn(timer, "updateSettings");

			plugin.settings.workMinutes = 45;
			await plugin.saveSettings();

			expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
			expect(updateSettingsSpy).toHaveBeenCalledWith(plugin.settings);
		});

		it("should update timer settings when settings change", async () => {
			const timer = (plugin as PluginWithPrivates)._timer;
			const updateSettingsSpy = jest.spyOn(timer, "updateSettings");

			plugin.settings.workMinutes = 45;
			await plugin.saveSettings();

			expect(updateSettingsSpy).toHaveBeenCalledWith(plugin.settings);
		});
	});

	describe("Command Integration", () => {
		beforeEach(async () => {
			await plugin.onload();
		});

		describe("Toggle Timer Command", () => {
			it("should start timer when not running", async () => {
				const timer = (plugin as PluginWithPrivates)._timer;
				expect(timer.isRunning).toBe(false);

				// Find and execute the toggle-timer command
				const mockAddCommand = plugin.addCommand as jest.Mock;
				const toggleCommand = mockAddCommand.mock.calls.find(
					(call) => call[0].id === "toggle-timer",
				);
				expect(toggleCommand).toBeDefined();

				// Execute the command callback
				jest.spyOn(timer, "toggleTimer");
				toggleCommand[0].callback();

				expect(timer.toggleTimer).toHaveBeenCalled();
			});

			it("should pause timer when running", async () => {
				const timer = (plugin as PluginWithPrivates)._timer;

				// Start the timer first
				timer.toggleTimer();
				expect(timer.isRunning).toBe(true);

				// Execute toggle command
				const mockAddCommand = plugin.addCommand as jest.Mock;
				const toggleCommand = mockAddCommand.mock.calls.find(
					(call) => call[0].id === "toggle-timer",
				);

				jest.spyOn(timer, "pauseTimer");
				toggleCommand[0].callback();

				expect(timer.pauseTimer).toHaveBeenCalled();
			});

			it("should handle timer being undefined", async () => {
				// Create plugin with undefined timer
				const testPlugin = new PomodoroPlugin({} as App, {
					id: "test",
					name: "Test",
					version: "1.0.0",
					minAppVersion: "0.15.0",
					author: "Test",
					description: "Test",
				});

				// Load the plugin to register commands but don't initialize timer
				await testPlugin.onload();

				const mockAddCommand = testPlugin.addCommand as jest.Mock;
				const toggleCommand = mockAddCommand.mock.calls.find(
					(call) => call[0].id === "toggle-timer",
				);

				// The toggle command must be registered
				expect(toggleCommand).toBeDefined();

				// Execute the callback and assert it does not throw (safe when timer is undefined)
				expect(() => toggleCommand[0].callback()).not.toThrow();
			});
		});

		describe("Reset Timer Command", () => {
			it("should reset timer when not running", async () => {
				const timer = (plugin as PluginWithPrivates)._timer;
				expect(timer.isRunning).toBe(false);

				const mockAddCommand = plugin.addCommand as jest.Mock;
				const resetCommand = mockAddCommand.mock.calls.find(
					(call) => call[0].id === "reset-timer",
				);

				jest.spyOn(timer, "resetTimer");
				resetCommand[0].callback();

				expect(timer.resetTimer).toHaveBeenCalled();
			});

			it("should not reset timer when running", async () => {
				const timer = (plugin as PluginWithPrivates)._timer;
				timer.toggleTimer();
				expect(timer.isRunning).toBe(true);

				const mockAddCommand = plugin.addCommand as jest.Mock;
				const resetCommand = mockAddCommand.mock.calls.find(
					(call) => call[0].id === "reset-timer",
				);

				jest.spyOn(timer, "resetTimer");
				resetCommand[0].callback();

				expect(timer.resetTimer).not.toHaveBeenCalled();
			});
		});

		describe("Cycle Timer Command", () => {
			it("should cycle timer when not running", async () => {
				const timer = (plugin as PluginWithPrivates)._timer;
				expect(timer.isRunning).toBe(false);

				const mockAddCommand = plugin.addCommand as jest.Mock;
				const cycleCommand = mockAddCommand.mock.calls.find(
					(call) => call[0].id === "cycle-timer",
				);

				jest.spyOn(timer, "cycleDuration");
				cycleCommand[0].callback();

				expect(timer.cycleDuration).toHaveBeenCalled();
			});

			it("should not cycle timer when running", async () => {
				const timer = (plugin as PluginWithPrivates)._timer;
				timer.toggleTimer();
				expect(timer.isRunning).toBe(true);

				const mockAddCommand = plugin.addCommand as jest.Mock;
				const cycleCommand = mockAddCommand.mock.calls.find(
					(call) => call[0].id === "cycle-timer",
				);

				jest.spyOn(timer, "cycleDuration");
				cycleCommand[0].callback();

				expect(timer.cycleDuration).not.toHaveBeenCalled();
			});
		});

		describe("Toggle Icon Visibility Command", () => {
			it("should toggle icon visibility and save settings", async () => {
				plugin.settings.showIcon = false;

				const mockAddCommand = plugin.addCommand as jest.Mock;
				const toggleIconCommand = mockAddCommand.mock.calls.find(
					(call) => call[0].id === "toggle-icon-visibility",
				);

				jest.spyOn(plugin, "saveSettings");
				toggleIconCommand[0].callback();

				expect(plugin.settings.showIcon).toBe(true);
				expect(plugin.saveSettings).toHaveBeenCalled();
			});
		});

		describe("Toggle Status Bar Command", () => {
			it("should toggle status bar visibility and save settings", async () => {
				const timer = (plugin as PluginWithPrivates)._timer;

				const mockAddCommand = plugin.addCommand as jest.Mock;
				const toggleStatusCommand = mockAddCommand.mock.calls.find(
					(call) => call[0].id === "toggle-status-bar",
				);

				jest.spyOn(timer, "toggleStatusBarVisibility");
				jest.spyOn(plugin, "saveSettings");
				toggleStatusCommand[0].callback();

				expect(timer.toggleStatusBarVisibility).toHaveBeenCalled();
				expect(plugin.saveSettings).toHaveBeenCalled();
			});
		});

		describe("Toggle Sound Notifications Command", () => {
			it("should toggle sound enabled setting", () => {
				plugin.settings.soundEnabled = false;

				const mockAddCommand = plugin.addCommand as jest.Mock;
				const command = mockAddCommand.mock.calls.find(
					(call) => call[0].id === "toggle-sound-notifications",
				);

				expect(command).toBeDefined();
				jest.spyOn(plugin, "saveSettings");
				command[0].callback();

				expect(plugin.settings.soundEnabled).toBe(true);
				expect(plugin.saveSettings).toHaveBeenCalled();
			});

			it("should toggle sound off when currently on", () => {
				plugin.settings.soundEnabled = true;

				const mockAddCommand = plugin.addCommand as jest.Mock;
				const command = mockAddCommand.mock.calls.find(
					(call) => call[0].id === "toggle-sound-notifications",
				);

				command[0].callback();

				expect(plugin.settings.soundEnabled).toBe(false);
			});
		});

		describe("Command Registration", () => {
			it("should register all core commands", () => {
				const mockAddCommand = plugin.addCommand as jest.Mock;
				const registeredCommandIds = mockAddCommand.mock.calls.map(
					(call) => call[0].id,
				);

				// Verify core commands are registered
				const coreCommands = [
					"toggle-timer",
					"reset-timer",
					"cycle-timer",
					"toggle-icon-visibility",
					"toggle-status-bar",
					"toggle-sound-notifications",
				];

				coreCommands.forEach((commandId) => {
					expect(registeredCommandIds).toContain(commandId);
				});
			});

			it("should register commands with descriptive names", () => {
				const mockAddCommand = plugin.addCommand as jest.Mock;

				const expectedCommandNames: Record<string, string> = {
					"toggle-timer": "Toggle timer",
					"reset-timer": "Reset current timer",
					"cycle-timer": "Cycle to next timer duration",
					"toggle-icon-visibility": "Toggle timer icon visibility",
					"toggle-status-bar": "Toggle status bar visibility",
					"toggle-sound-notifications": "Toggle sound notifications",
				};

				Object.entries(expectedCommandNames).forEach(
					([id, expectedName]) => {
						const command = mockAddCommand.mock.calls.find(
							(call) => call[0].id === id,
						);
						expect(command).toBeDefined();
						expect(command[0].name).toBe(expectedName);
					},
				);
			});
		});
	});
});

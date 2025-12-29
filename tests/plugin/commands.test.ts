import "../setup";
import PomodoroPlugin from "../../src/main";
import { App } from "obsidian";
import { PluginWithPrivates } from "../setup";

describe("PomodoroPlugin - Commands", () => {
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

	describe("Toggle Timer Command", () => {
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
			const resetCommand = mockAddCommand.mock.calls.find(
				(call) => call[0].id === "reset-timer",
			);

			// The reset command must be registered
			expect(resetCommand).toBeDefined();

			// Execute the callback and assert it does not throw (safe when timer is undefined)
			expect(() => resetCommand[0].callback()).not.toThrow();
		});
	});

	describe("Cycle Timer Command", () => {
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
			const cycleCommand = mockAddCommand.mock.calls.find(
				(call) => call[0].id === "cycle-timer",
			);

			// The cycle command must be registered
			expect(cycleCommand).toBeDefined();

			// Execute the callback and assert it does not throw (safe when timer is undefined)
			expect(() => cycleCommand[0].callback()).not.toThrow();
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

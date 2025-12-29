import "../setup";
import PomodoroPlugin from "../../src/main";
import { App, PluginWithPrivates } from "../setup";
import { createStandardTestPlugin, cleanupStandardTestPlugin } from "../helpers/plugin-test-helpers";

describe("PomodoroPlugin - Commands", () => {
	let plugin: PomodoroPlugin;

	beforeEach(async () => {
		const setup = await createStandardTestPlugin();
		plugin = setup.plugin;
	});

	afterEach(async () => {
		await cleanupStandardTestPlugin(plugin);
	});

	describe("Command Safety with Undefined Timer", () => {
		const commandsToTest = [
			{ id: "toggle-timer", name: "Toggle Timer" },
			{ id: "reset-timer", name: "Reset Timer" },
			{ id: "cycle-timer", name: "Cycle Timer" },
		];

		commandsToTest.forEach(({ id, name }) => {
			it(`should handle ${name.toLowerCase()} when timer is undefined`, async () => {
				// Create plugin with undefined timer
				const testPlugin = new PomodoroPlugin({} as App, {
					id: "test",
					name: "Test",
					version: "1.0.0",
					minAppVersion: "0.15.0",
					author: "Test",
					description: "Test",
				});

				// Load plugin to register commands but don't initialize timer
				await testPlugin.onload();

				const mockAddCommand = testPlugin.addCommand as jest.Mock;
				const command = mockAddCommand.mock.calls.find(
					(call) => call[0].id === id,
				);

				// The command must be registered
				expect(command).toBeDefined();

				// Execute callback and assert it does not throw (safe when timer is undefined)
				expect(() => command[0].callback()).not.toThrow();
			});
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

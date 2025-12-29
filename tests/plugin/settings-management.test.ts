import "../setup";
import PomodoroPlugin from "../../src/main";
import { PluginWithPrivates } from "../setup";
import { createStandardTestPlugin, cleanupStandardTestPlugin } from "../helpers/plugin-test-helpers";

describe("PomodoroPlugin - Settings Management", () => {
	let plugin: PomodoroPlugin;

	beforeEach(async () => {
		const setup = await createStandardTestPlugin();
		plugin = setup.plugin;
	});

	afterEach(async () => {
		await cleanupStandardTestPlugin(plugin);
	});

	describe("Settings Management", () => {
		it("should update timer settings when settings change", async () => {
			const timer = (plugin as PluginWithPrivates)._timer;
			const updateSettingsSpy = jest.spyOn(timer, "updateSettings");

			plugin.settings.workMinutes = 45;
			await plugin.saveSettings();

			expect(updateSettingsSpy).toHaveBeenCalledWith(plugin.settings);
		});
	});
});

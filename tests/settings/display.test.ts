/* eslint-disable @typescript-eslint/no-explicit-any */
import "../setup";
import { PomodoroSettingTab } from "../../src/components/SettingsTab";
import type PomodoroPlugin from "../../src/main";
import { App } from "obsidian";
import { SoundManager } from "../../src/logic/soundManager";

describe("PomodoroSettingTab - Display", () => {
	let settingTab: PomodoroSettingTab;
	let mockPlugin: PomodoroPlugin;
	let mockApp: App;
	let mockContainerEl: HTMLElement;
	let mockSoundManager: SoundManager;

	beforeEach(async () => {
		jest.clearAllMocks();

		mockApp = {} as App;
		const manifest = {
			id: "test-plugin",
			name: "Test Plugin",
			version: "1.0.0",
			minAppVersion: "0.15.0",
			author: "Test Author",
			description: "Test Description",
		};

		// Dynamically import the plugin class to avoid circular runtime imports
		// between `src/main` and `src/components/SettingsTab` during test load.
		const { default: PomodoroPluginClass } = await import("../../src/main");
		mockPlugin = new PomodoroPluginClass(mockApp, manifest);
		mockPlugin.loadData = jest.fn().mockResolvedValue({});
		mockPlugin.saveData = jest.fn().mockResolvedValue(undefined);
		mockPlugin.saveSettings = jest.fn().mockResolvedValue(undefined);
		mockPlugin.resetTimer = jest.fn();
		mockPlugin.resetPomodoroSession = jest.fn();

		await mockPlugin.onload();

		mockContainerEl = {
			empty: jest.fn(),
			createEl: jest.fn().mockReturnValue({
				textContent: "",
				innerHTML: "",
			}),
			appendChild: jest.fn(),
		} as unknown as HTMLElement;

		mockSoundManager = {
			getBuiltInSounds: jest
				.fn()
				.mockReturnValue(["chime.wav", "ding.wav"]),
			previewSound: jest.fn().mockResolvedValue(undefined),
			updateSettings: jest.fn(),
			cleanup: jest.fn(),
		} as unknown as SoundManager;

		settingTab = new PomodoroSettingTab(
			mockApp,
			mockPlugin,
			mockSoundManager,
		);
		settingTab.containerEl = mockContainerEl;
	});

	it("should clear container and create settings UI", () => {
		settingTab.display();

		expect(mockContainerEl.empty).toHaveBeenCalled();
		const SettingMock = (jest.requireMock("obsidian") as any)
			.Setting as jest.Mock;
		expect(SettingMock).toHaveBeenCalled();
	});

	it("should create all required timer settings", () => {
		settingTab.display();

		const settingMock = (jest.requireMock("obsidian") as any)
			.Setting as jest.Mock;
		const allSettings = settingMock.mock.results.map(
			(result: any) => result.value,
		);
		const settingNames = allSettings
			.map((setting: any) => setting.setName.mock.calls[0]?.[0])
			.filter(Boolean);

		// Test for presence of specific settings rather than counting total
		expect(settingNames).toContain("Work Duration");
		expect(settingNames).toContain("Short Break Duration");
		expect(settingNames).toContain("Long Break Duration");
		expect(settingNames).toContain("Intervals Before Long Break");
		expect(settingNames).toContain("Auto-start Next Timer");
		expect(settingNames).toContain("Show Timer Icon");
	});
});

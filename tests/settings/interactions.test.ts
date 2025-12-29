 
import "../setup";
import { PomodoroSettingTab } from "../../src/components/SettingsTab";
import type PomodoroPlugin from "../../src/main";
import { App } from "obsidian";
import { SoundManager } from "../../src/logic/soundManager";
import {
	getTextComponentBySettingName,
	getToggleComponentBySettingName,
} from "../helpers/settings-test-helpers";

describe("PomodoroSettingTab - Interactions", () => {
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

	describe("Settings Interactions", () => {
		it("should update workMinutes on valid input", async () => {
			settingTab.display();
			const component = getTextComponentBySettingName("Work Duration");

			await component.triggerChange("30");

			expect(mockPlugin.settings.workMinutes).toBe(30);
			expect(mockPlugin.resetTimer).toHaveBeenCalled();
		});

		it("should update shortBreakMinutes on valid input", async () => {
			settingTab.display();
			const component = getTextComponentBySettingName(
				"Short Break Duration",
			);

			await component.triggerChange("10");

			expect(mockPlugin.settings.shortBreakMinutes).toBe(10);
			expect(mockPlugin.resetTimer).toHaveBeenCalled();
		});

		it("should update longBreakMinutes on valid input", async () => {
			settingTab.display();
			const component = getTextComponentBySettingName(
				"Long Break Duration",
			);

			await component.triggerChange("20");

			expect(mockPlugin.settings.longBreakMinutes).toBe(20);
			expect(mockPlugin.resetTimer).toHaveBeenCalled();
		});

		it("should update intervalsBeforeLongBreak on valid input", async () => {
			settingTab.display();
			const component = getTextComponentBySettingName(
				"Intervals Before Long Break",
			);

			await component.triggerChange("3");

			expect(mockPlugin.settings.intervalsBeforeLongBreak).toBe(3);
			expect(mockPlugin.resetPomodoroSession).toHaveBeenCalled();
			expect(mockPlugin.workIntervalCount).toBe(0);
			expect(mockPlugin.currentDurationIndex).toBe(0);
		});

		it("should update showIcon on toggle", async () => {
			settingTab.display();
			const component =
				getToggleComponentBySettingName("Show Timer Icon");

			await component.triggerChange(true);

			expect(mockPlugin.settings.showIcon).toBe(true);
		});

		it("should update autoProgressEnabled on toggle", async () => {
			settingTab.display();
			const component = getToggleComponentBySettingName(
				"Auto-start Next Timer",
			);

			await component.triggerChange(true);

			expect(mockPlugin.settings.autoProgressEnabled).toBe(true);
		});
	});
});

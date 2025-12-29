 
import "../setup";
import { PomodoroSettingTab } from "../../src/components/SettingsTab";
import type PomodoroPlugin from "../../src/main";
import { App } from "obsidian";
import { SoundManager } from "../../src/logic/soundManager";
import {
	testNumericValidation,
	commonInvalidInputs,
	commonValidInputs,
} from "../helpers/settings-test-helpers";

describe("PomodoroSettingTab - Validation", () => {
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

	describe("Input Validation", () => {

		describe("Work Duration Validation", () => {
			// eslint-disable-next-line jest/expect-expect
			it("should reject invalid inputs", async () => {
				await testNumericValidation(
					"Work Duration",
					"workMinutes",
					commonInvalidInputs,
					() => mockPlugin.settings.workMinutes,
					mockPlugin.saveSettings,
					undefined,
					settingTab,
					mockPlugin,
				);
			});

			// eslint-disable-next-line jest/expect-expect
			it("should accept valid inputs", async () => {
				await testNumericValidation(
					"Work Duration",
					"workMinutes",
					commonValidInputs,
					() => mockPlugin.settings.workMinutes,
					mockPlugin.saveSettings,
					undefined,
					settingTab,
					mockPlugin,
				);
			});
		});

		describe("Short Break Validation", () => {
			// eslint-disable-next-line jest/expect-expect
			it("should reject invalid inputs", async () => {
				await testNumericValidation(
					"Short Break Duration",
					"shortBreakMinutes",
					commonInvalidInputs,
					() => mockPlugin.settings.shortBreakMinutes,
					mockPlugin.saveSettings,
					undefined,
					settingTab,
					mockPlugin,
				);
			});

			// eslint-disable-next-line jest/expect-expect
			it("should accept valid inputs", async () => {
				await testNumericValidation(
					"Short Break Duration",
					"shortBreakMinutes",
					[{ description: "valid", input: "10", shouldUpdate: true }],
					() => mockPlugin.settings.shortBreakMinutes,
					mockPlugin.saveSettings,
					undefined,
					settingTab,
					mockPlugin,
				);
			});
		});

		describe("Long Break Validation", () => {
			// eslint-disable-next-line jest/expect-expect
			it("should reject invalid inputs", async () => {
				await testNumericValidation(
					"Long Break Duration",
					"longBreakMinutes",
					commonInvalidInputs,
					() => mockPlugin.settings.longBreakMinutes,
					mockPlugin.saveSettings,
					undefined,
					settingTab,
					mockPlugin,
				);
			});

			// eslint-disable-next-line jest/expect-expect
			it("should accept valid inputs", async () => {
				await testNumericValidation(
					"Long Break Duration",
					"longBreakMinutes",
					[{ description: "valid", input: "20", shouldUpdate: true }],
					() => mockPlugin.settings.longBreakMinutes,
					mockPlugin.saveSettings,
					undefined,
					settingTab,
					mockPlugin,
				);
			});
		});

		describe("Intervals Before Long Break Validation", () => {
			// eslint-disable-next-line jest/expect-expect
			it("should reject invalid inputs", async () => {
				await testNumericValidation(
					"Intervals Before Long Break",
					"intervalsBeforeLongBreak",
					commonInvalidInputs,
					() => mockPlugin.settings.intervalsBeforeLongBreak,
					mockPlugin.saveSettings,
					undefined,
					settingTab,
					mockPlugin,
				);
			});

			// eslint-disable-next-line jest/expect-expect
			it("should accept valid inputs", async () => {
				await testNumericValidation(
					"Intervals Before Long Break",
					"intervalsBeforeLongBreak",
					[{ description: "valid", input: "3", shouldUpdate: true }],
					() => mockPlugin.settings.intervalsBeforeLongBreak,
					mockPlugin.saveSettings,
					undefined,
					settingTab,
					mockPlugin,
				);
			});
		});
	});
});

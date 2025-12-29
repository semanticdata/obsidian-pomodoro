/* eslint-disable @typescript-eslint/no-explicit-any */
import "../setup";
import { PomodoroSettingTab } from "../../src/components/SettingsTab";
import type PomodoroPlugin from "../../src/main";
import { App } from "obsidian";
import { SoundManager } from "../../src/logic/soundManager";

/**
 * Helper to create a mock text component that captures callbacks for testing.
 * Instead of complex circular references, we use a simple closure to capture the onChange callback.
 */
function createMockTextComponent() {
	let onChangeCallback: ((value: string) => void) | null = null;

	const component: any = {
		setPlaceholder: jest.fn().mockReturnThis(),
		setValue: jest.fn().mockReturnThis(),
		onChange: jest.fn((cb: (value: string) => void) => {
			onChangeCallback = cb;
			return component;
		}),
		onInput: jest.fn().mockReturnThis(),
		// Helper method to trigger the onChange callback in tests
		triggerChange: async (value: string) => {
			if (onChangeCallback) {
				await onChangeCallback(value);
			}
		},
	};

	return component;
}

/**
 * Helper to create a mock toggle component
 */
function createMockToggleComponent() {
	let onChangeCallback: ((value: boolean) => void) | null = null;

	const component: any = {
		setValue: jest.fn().mockReturnThis(),
		onChange: jest.fn((cb: (value: boolean) => void) => {
			onChangeCallback = cb;
			return component;
		}),
		triggerChange: async (value: boolean) => {
			if (onChangeCallback) {
				await onChangeCallback(value);
			}
		},
	};

	return component;
}

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

	/**
	 * Helper to find a setting by name and extract its text component
	 */
	function getTextComponentBySettingName(name: string) {
		const settingMock = (jest.requireMock("obsidian") as any)
			.Setting as jest.Mock;
		const allSettings = settingMock.mock.results.map(
			(result: any) => result.value,
		);

		const setting = allSettings.find(
			(s: any) => s.setName.mock.calls[0]?.[0] === name,
		);

		if (!setting) {
			throw new Error(`Setting with name "${name}" not found`);
		}

		const addTextCall = setting.addText.mock.calls[0];
		if (!addTextCall) {
			throw new Error(`Setting "${name}" has no text component`);
		}

		// Re-create the component by calling the callback
		const callback = addTextCall[0];
		const component = createMockTextComponent();
		callback(component);

		return component;
	}

	/**
	 * Helper to find a setting by name and extract its toggle component
	 */
	function getToggleComponentBySettingName(name: string) {
		const settingMock = (jest.requireMock("obsidian") as any)
			.Setting as jest.Mock;
		const allSettings = settingMock.mock.results.map(
			(result: any) => result.value,
		);

		const setting = allSettings.find(
			(s: any) => s.setName.mock.calls[0]?.[0] === name,
		);

		if (!setting) {
			throw new Error(`Setting with name "${name}" not found`);
		}

		const addToggleCall = setting.addToggle.mock.calls[0];
		if (!addToggleCall) {
			throw new Error(`Setting "${name}" has no toggle component`);
		}

		const callback = addToggleCall[0];
		const component = createMockToggleComponent();
		callback(component);

		return component;
	}

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

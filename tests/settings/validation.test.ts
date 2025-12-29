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

	describe("Input Validation", () => {
		interface ValidationTestCase {
			description: string;
			input: string;
			shouldUpdate: boolean;
		}

		/**
		 * Reusable validation test helper - tests validation for a numeric setting
		 */
		async function testNumericValidation(
			settingName: string,
			settingProperty: keyof typeof mockPlugin.settings,
			testCases: ValidationTestCase[],
		) {
			for (const testCase of testCases) {
				// Re-setup for each test case
				jest.clearAllMocks();
				settingTab.display();

				const initialValue = mockPlugin.settings[settingProperty];
				const component = getTextComponentBySettingName(settingName);

				await component.triggerChange(testCase.input);

				if (testCase.shouldUpdate) {
					expect(mockPlugin.settings[settingProperty]).not.toBe(
						initialValue,
					);
					expect(mockPlugin.saveSettings).toHaveBeenCalled();
				} else {
					expect(mockPlugin.settings[settingProperty]).toBe(
						initialValue,
					);
					expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
				}
			}
		}

		// Common invalid inputs that all numeric fields should reject
		const commonInvalidInputs: ValidationTestCase[] = [
			{ description: "zero value", input: "0", shouldUpdate: false },
			{
				description: "negative value",
				input: "-5",
				shouldUpdate: false,
			},
			{
				description: "decimal value",
				input: "25.5",
				shouldUpdate: false,
			},
			{ description: "empty string", input: "", shouldUpdate: false },
			{
				description: "whitespace only",
				input: "   ",
				shouldUpdate: false,
			},
			{
				description: "non-numeric text",
				input: "abc",
				shouldUpdate: false,
			},
		];

		// Valid inputs that should be accepted
		const commonValidInputs: ValidationTestCase[] = [
			{
				description: "valid positive integer",
				input: "30",
				shouldUpdate: true,
			},
			{
				description: "whitespace trimmed",
				input: "  30  ",
				shouldUpdate: true,
			},
		];

		describe("Work Duration Validation", () => {
			commonInvalidInputs.forEach((testCase) => {
				it(`should reject ${testCase.description}`, async () => {
					await testNumericValidation(
						"Work Duration",
						"workMinutes",
						[testCase],
					);
				});
			});

			commonValidInputs.forEach((testCase) => {
				it(`should accept ${testCase.description}`, async () => {
					await testNumericValidation(
						"Work Duration",
						"workMinutes",
						[testCase],
					);
				});
			});
		});

		describe("Short Break Validation", () => {
			it("should reject invalid inputs", async () => {
				await testNumericValidation(
					"Short Break Duration",
					"shortBreakMinutes",
					commonInvalidInputs,
				);
			});

			it("should accept valid inputs", async () => {
				await testNumericValidation(
					"Short Break Duration",
					"shortBreakMinutes",
					[{ description: "valid", input: "10", shouldUpdate: true }],
				);
			});
		});

		describe("Long Break Validation", () => {
			it("should reject invalid inputs", async () => {
				await testNumericValidation(
					"Long Break Duration",
					"longBreakMinutes",
					commonInvalidInputs,
				);
			});

			it("should accept valid inputs", async () => {
				await testNumericValidation(
					"Long Break Duration",
					"longBreakMinutes",
					[{ description: "valid", input: "20", shouldUpdate: true }],
				);
			});
		});

		describe("Intervals Before Long Break Validation", () => {
			it("should reject invalid inputs", async () => {
				await testNumericValidation(
					"Intervals Before Long Break",
					"intervalsBeforeLongBreak",
					commonInvalidInputs,
				);
			});

			it("should accept valid inputs", async () => {
				await testNumericValidation(
					"Intervals Before Long Break",
					"intervalsBeforeLongBreak",
					[{ description: "valid", input: "3", shouldUpdate: true }],
				);
			});
		});
	});
});

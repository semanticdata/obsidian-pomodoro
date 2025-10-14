import "./setup";
import { PomodoroSettingTab } from "../src/components/SettingsTab";
import type PomodoroPlugin from "../src/main";
import { App, Setting } from "obsidian";
import { SoundManager } from "../src/logic/soundManager";

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

/**
 * Helper to create a mock dropdown component
 */
function createMockDropdownComponent() {
	let onChangeCallback: ((value: string) => void) | null = null;

	const component: any = {
		addOption: jest.fn().mockReturnThis(),
		setValue: jest.fn().mockReturnThis(),
		onChange: jest.fn((cb: (value: string) => void) => {
			onChangeCallback = cb;
			return component;
		}),
		triggerChange: async (value: string) => {
			if (onChangeCallback) {
				await onChangeCallback(value);
			}
		},
	};

	return component;
}

/**
 * Helper to create a mock slider component
 */
function createMockSliderComponent() {
	let onChangeCallback: ((value: number) => void) | null = null;

	const component: any = {
		setLimits: jest.fn().mockReturnThis(),
		setValue: jest.fn().mockReturnThis(),
		setDynamicTooltip: jest.fn().mockReturnThis(),
		onChange: jest.fn((cb: (value: number) => void) => {
			onChangeCallback = cb;
			return component;
		}),
		triggerChange: async (value: number) => {
			if (onChangeCallback) {
				await onChangeCallback(value);
			}
		},
	};

	return component;
}

/**
 * Helper to create a mock button component
 */
function createMockButtonComponent() {
	let onClickCallback: (() => void) | null = null;

	const component: any = {
		setButtonText: jest.fn().mockReturnThis(),
		onClick: jest.fn((cb: () => void) => {
			onClickCallback = cb;
			return component;
		}),
		triggerClick: () => {
			if (onClickCallback) {
				onClickCallback();
			}
		},
	};

	return component;
}

// Simplified Setting mock - no circular references, just straightforward mocking
jest.mock("obsidian", () => {
	const original = jest.requireActual("obsidian");

	return {
		...original,
		Setting: jest.fn().mockImplementation(() => {
				const settingInstance: any = {
					setName: jest.fn(function (this: any) {
						return settingInstance;
					}),
					setDesc: jest.fn(function (this: any) {
						return settingInstance;
					}),
					setHeading: jest.fn(function (this: any) {
						return settingInstance;
					}),
				settingEl: {
					style: { display: "" },
				},
				addText: jest.fn(function (this: any, cb) {
					const component = createMockTextComponent();
					cb(component);
					return this;
				}),
				addToggle: jest.fn(function (this: any, cb) {
					const component = createMockToggleComponent();
					cb(component);
					return this;
				}),
				addDropdown: jest.fn(function (this: any, cb) {
					const component = createMockDropdownComponent();
					cb(component);
					return this;
				}),
				addSlider: jest.fn(function (this: any, cb) {
					const component = createMockSliderComponent();
					cb(component);
					return this;
				}),
				addButton: jest.fn(function (this: any, cb) {
					const component = createMockButtonComponent();
					cb(component);
					return this;
				}),
			};

			return settingInstance;
		}),
	};
});

describe("PomodoroSettingTab", () => {
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
		const { default: PomodoroPluginClass } = await import(
			"../src/main"
		);
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
			mockSoundManager
		);
		settingTab.containerEl = mockContainerEl;
	});

	/**
	 * Helper to find a setting by name and extract its text component
	 */
	function getTextComponentBySettingName(name: string) {
		const settingMock = Setting as jest.Mock;
		const allSettings = settingMock.mock.results.map(
			(result: any) => result.value
		);

		const setting = allSettings.find(
			(s: any) => s.setName.mock.calls[0]?.[0] === name
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
		const settingMock = Setting as jest.Mock;
		const allSettings = settingMock.mock.results.map(
			(result: any) => result.value
		);

		const setting = allSettings.find(
			(s: any) => s.setName.mock.calls[0]?.[0] === name
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

	describe("Display", () => {
		it("should clear container and create settings UI", () => {
			settingTab.display();

			expect(mockContainerEl.empty).toHaveBeenCalled();
			expect(Setting).toHaveBeenCalled();
		});

		it("should create all required timer settings", () => {
			settingTab.display();

			const settingMock = Setting as jest.Mock;
			const allSettings = settingMock.mock.results.map(
				(result: any) => result.value
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

	describe("Settings Interactions", () => {
		it("should update workMinutes on valid input", async () => {
			settingTab.display();
			const component = getTextComponentBySettingName("Work Duration");

			await component.triggerChange("30");

			expect(mockPlugin.settings.workMinutes).toBe(30);
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
			expect(mockPlugin.resetTimer).toHaveBeenCalled();
		});

		it("should not update workMinutes on invalid input", async () => {
			settingTab.display();
			const initialWorkMinutes = mockPlugin.settings.workMinutes;
			const component = getTextComponentBySettingName("Work Duration");

			await component.triggerChange("invalid");

			expect(mockPlugin.settings.workMinutes).toBe(initialWorkMinutes);
			expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
			expect(mockPlugin.resetTimer).not.toHaveBeenCalled();
		});

		it("should update shortBreakMinutes on valid input", async () => {
			settingTab.display();
			const component = getTextComponentBySettingName(
				"Short Break Duration"
			);

			await component.triggerChange("10");

			expect(mockPlugin.settings.shortBreakMinutes).toBe(10);
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
			expect(mockPlugin.resetTimer).toHaveBeenCalled();
		});

		it("should update longBreakMinutes on valid input", async () => {
			settingTab.display();
			const component = getTextComponentBySettingName(
				"Long Break Duration"
			);

			await component.triggerChange("20");

			expect(mockPlugin.settings.longBreakMinutes).toBe(20);
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
			expect(mockPlugin.resetTimer).toHaveBeenCalled();
		});

		it("should update intervalsBeforeLongBreak on valid input", async () => {
			settingTab.display();
			const component = getTextComponentBySettingName(
				"Intervals Before Long Break"
			);

			await component.triggerChange("3");

			expect(mockPlugin.settings.intervalsBeforeLongBreak).toBe(3);
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
			expect(mockPlugin.resetPomodoroSession).toHaveBeenCalled();
			expect(mockPlugin.workIntervalCount).toBe(0);
			expect(mockPlugin.currentDurationIndex).toBe(0);
		});

		it("should update showIcon on toggle", async () => {
			settingTab.display();
			const component = getToggleComponentBySettingName(
				"Show Timer Icon"
			);

			await component.triggerChange(true);

			expect(mockPlugin.settings.showIcon).toBe(true);
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
		});

		it("should update autoProgressEnabled on toggle", async () => {
			settingTab.display();
			const component = getToggleComponentBySettingName(
				"Auto-start Next Timer"
			);

			await component.triggerChange(true);

			expect(mockPlugin.settings.autoProgressEnabled).toBe(true);
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
		});
	});

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
			testCases: ValidationTestCase[]
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
						initialValue
					);
					expect(mockPlugin.saveSettings).toHaveBeenCalled();
				} else {
					expect(mockPlugin.settings[settingProperty]).toBe(
						initialValue
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
					await testNumericValidation("Work Duration", "workMinutes", [
						testCase,
					]);
				});
			});

			commonValidInputs.forEach((testCase) => {
				it(`should accept ${testCase.description}`, async () => {
					await testNumericValidation("Work Duration", "workMinutes", [
						testCase,
					]);
				});
			});
		});

		describe("Short Break Validation", () => {
			it("should reject invalid inputs", async () => {
				await testNumericValidation(
					"Short Break Duration",
					"shortBreakMinutes",
					commonInvalidInputs
				);
			});

			it("should accept valid inputs", async () => {
				await testNumericValidation(
					"Short Break Duration",
					"shortBreakMinutes",
					[{ description: "valid", input: "10", shouldUpdate: true }]
				);
			});
		});

		describe("Long Break Validation", () => {
			it("should reject invalid inputs", async () => {
				await testNumericValidation(
					"Long Break Duration",
					"longBreakMinutes",
					commonInvalidInputs
				);
			});

			it("should accept valid inputs", async () => {
				await testNumericValidation(
					"Long Break Duration",
					"longBreakMinutes",
					[{ description: "valid", input: "20", shouldUpdate: true }]
				);
			});
		});

		describe("Intervals Before Long Break Validation", () => {
			it("should reject invalid inputs", async () => {
				await testNumericValidation(
					"Intervals Before Long Break",
					"intervalsBeforeLongBreak",
					commonInvalidInputs
				);
			});

			it("should accept valid inputs", async () => {
				await testNumericValidation(
					"Intervals Before Long Break",
					"intervalsBeforeLongBreak",
					[{ description: "valid", input: "4", shouldUpdate: true }]
				);
			});
		});
	});
});

import { jest } from "@jest/globals";

/**
 * Helper to create a mock text component that captures callbacks for testing.
 * Instead of complex circular references, we use a simple closure to capture the onChange callback.
 */
export function createMockTextComponent() {
	let onChangeCallback: ((value: string) => void) | null = null;

	const component: Record<string, unknown> = {
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

	return component as Record<string, unknown> & { triggerChange: (value: string) => Promise<void> };
}

/**
 * Helper to create a mock toggle component
 */
export function createMockToggleComponent() {
	let onChangeCallback: ((value: boolean) => void) | null = null;

	const component: Record<string, unknown> = {
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

	return component as Record<string, unknown> & { triggerChange: (value: boolean) => Promise<void> };
}

/**
 * Helper to find a setting by name and extract its text component
 */
export function getTextComponentBySettingName(settingName: string) {
	const settingMock = (jest.requireMock("obsidian") as Record<string, unknown>)
		.Setting as jest.Mock;
	const allSettings = settingMock.mock.results.map(
		(result: unknown) => (result as { value: unknown }).value,
	);

	const setting = allSettings.find(
		(s: unknown) => {
			const settingObj = s as { setName: { mock: { calls: string[][] } } };
			return settingObj.setName.mock.calls[0]?.[0] === settingName;
		},
	);

	if (!setting) {
		throw new Error(`Setting with name "${settingName}" not found`);
	}

	const addTextCall = (setting as { addText: { mock: { calls: unknown[][] } } }).addText.mock.calls[0];
	if (!addTextCall) {
		throw new Error(`Setting "${settingName}" has no text component`);
	}

	// Re-create the component by calling the callback
	const callback = addTextCall[0] as (component: unknown) => void;
	const component = createMockTextComponent();
	callback(component);

	return component;
}

/**
 * Helper to find a setting by name and extract its toggle component
 */
export function getToggleComponentBySettingName(settingName: string) {
	const settingMock = (jest.requireMock("obsidian") as Record<string, unknown>)
		.Setting as jest.Mock;
	const allSettings = settingMock.mock.results.map(
		(result: unknown) => (result as { value: unknown }).value,
	);

	const setting = allSettings.find(
		(s: unknown) => {
			const settingObj = s as { setName: { mock: { calls: string[][] } } };
			return settingObj.setName.mock.calls[0]?.[0] === settingName;
		},
	);

	if (!setting) {
		throw new Error(`Setting with name "${settingName}" not found`);
	}

	const addToggleCall = (setting as { addToggle: { mock: { calls: unknown[][] } } }).addToggle.mock.calls[0];
	if (!addToggleCall) {
		throw new Error(`Setting "${settingName}" has no toggle component`);
	}

	const callback = addToggleCall[0] as (component: unknown) => void;
	const component = createMockToggleComponent();
	callback(component);

	return component;
}

/**
 * Validation test case interface for consistent testing
 */
export interface ValidationTestCase {
	description: string;
	input: string;
	shouldUpdate: boolean;
}

/**
 * Reusable validation test helper - tests validation for a numeric setting
 */
export async function testNumericValidation(
	settingName: string,
	settingProperty: string,
	testCases: ValidationTestCase[],
	getCurrentValue: () => unknown,
	expectSaveSettings: jest.Mock,
	expectResetTimer?: jest.Mock,
) {
	for (const testCase of testCases) {
		// Re-setup for each test case
		jest.clearAllMocks();

		const initialValue = getCurrentValue();
		const component = getTextComponentBySettingName(settingName);

		await component.triggerChange(testCase.input);

		if (testCase.shouldUpdate) {
			expect(getCurrentValue()).not.toBe(initialValue);
			expect(expectSaveSettings).toHaveBeenCalled();
			if (expectResetTimer) {
				expect(expectResetTimer).toHaveBeenCalled();
			}
		} else {
			expect(getCurrentValue()).toBe(initialValue);
			expect(expectSaveSettings).not.toHaveBeenCalled();
			if (expectResetTimer) {
				expect(expectResetTimer).not.toHaveBeenCalled();
			}
		}
	}
}

// Common invalid inputs that all numeric fields should reject
export const commonInvalidInputs: ValidationTestCase[] = [
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
export const commonValidInputs: ValidationTestCase[] = [
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

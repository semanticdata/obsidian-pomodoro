import { jest } from "@jest/globals";
import PomodoroPlugin from "../../src/main";
import { App } from "obsidian";
import { PluginWithPrivates } from "../setup";

export interface TestPluginSetup {
	plugin: PomodoroPlugin;
	mockApp: App;
}

/**
 * Creates a standardized plugin setup for testing
 * Reduces duplication across test files
 */
export async function createTestPlugin(): Promise<TestPluginSetup> {
	// Reset mocks before each test
	jest.clearAllMocks();

	const mockApp = {} as App; // Minimal App mock
	const manifest = {
		id: "test-plugin",
		name: "Test Plugin",
		version: "1.0.0",
		minAppVersion: "0.15.0",
		author: "Test Author",
		description: "Test Description",
	};

	const plugin = new PomodoroPlugin(mockApp, manifest);

	// The mocked 'obsidian' module's Plugin class will provide mocks for these:
	plugin.loadData = jest.fn(() => Promise.resolve({}));
	plugin.saveData = jest.fn(() => Promise.resolve());

	await plugin.onload();

	return { plugin, mockApp };
}

/**
 * Standard cleanup for plugin tests
 * Ensures proper timer cleanup and plugin unloading
 */
export async function cleanupTestPlugin(plugin: PomodoroPlugin): Promise<void> {
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
}

/**
 * Creates a plugin with custom saved data for testing settings loading
 */
export async function createTestPluginWithSavedData(
	savedData: Record<string, unknown>,
): Promise<TestPluginSetup> {
	const { plugin, mockApp } = await createTestPlugin();
	
	// Override loadData mock to return custom data
	plugin.loadData = jest.fn(() => Promise.resolve(savedData));
	
	// Reload the plugin to trigger settings loading
	await plugin.onunload();
	await plugin.onload();
	
	return { plugin, mockApp };
}

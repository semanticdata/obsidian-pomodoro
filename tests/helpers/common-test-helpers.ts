import { jest } from "@jest/globals";
import PomodoroPlugin from "../../src/main";
import { App } from "obsidian";
import { PluginWithPrivates } from "../setup";

export interface StandardTestSetup {
	plugin: PomodoroPlugin;
	mockApp: App;
}

/**
 * Creates a standardized plugin setup for testing
 * This replaces the repetitive beforeEach setup in multiple test files
 */
export async function createStandardTestPlugin(): Promise<StandardTestSetup> {
	jest.clearAllMocks();

	const mockApp = {} as App;
	const manifest = {
		id: "test-plugin",
		name: "Test Plugin",
		version: "1.0.0",
		minAppVersion: "0.15.0",
		author: "Test Author",
		description: "Test Description",
	};

	const plugin = new PomodoroPlugin(mockApp, manifest);

	(plugin.loadData as jest.Mock) = jest.fn().mockResolvedValue({});
	(plugin.saveData as jest.Mock) = jest.fn().mockResolvedValue(undefined);

	await plugin.onload();

	return { plugin, mockApp };
}

/**
 * Standard cleanup for plugin tests
 * This replaces the repetitive afterEach cleanup in multiple test files
 */
export async function cleanupStandardTestPlugin(plugin: PomodoroPlugin): Promise<void> {
	const timer = (plugin as PluginWithPrivates)?._timer;
	if (timer) {
		timer.pauseTimer();
		timer.cleanup();
	}

	if (plugin.onunload) {
		await plugin.onunload();
	}
}

/**
 * Creates a plugin without loading it (for testing uninitialized state)
 */
export function createUninitializedTestPlugin(): PomodoroPlugin {
	const mockApp = {} as App;
	const manifest = {
		id: "test-plugin",
		name: "Test Plugin",
		version: "1.0.0",
		minAppVersion: "0.15.0",
		author: "Test Author",
		description: "Test Description",
	};

	return new PomodoroPlugin(mockApp, manifest);
}

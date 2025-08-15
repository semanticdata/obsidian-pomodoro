import { Plugin } from "obsidian";
import { PomodoroSettings, DEFAULT_SETTINGS } from "./types";
import { PomodoroSettingTab } from "./components/SettingsTab";
import { PomodoroTimer } from "./logic/timer";

export default class PomodoroPlugin extends Plugin {
	settings!: PomodoroSettings;
	private timer!: PomodoroTimer;
	private statusBarItem!: HTMLElement;

	async onload() {
		await this.loadSettings();

		this.statusBarItem = this.addStatusBarItem();
		this.timer = new PomodoroTimer(this, this.settings, this.statusBarItem);

		this.addSettingTab(new PomodoroSettingTab(this.app, this));

		// Add command to toggle status bar visibility
		this.addCommand({
			id: 'toggle-status-bar',
			name: 'Toggle status bar visibility',
			callback: () => {
				this.timer.toggleStatusBarVisibility();
				this.saveSettings(); // Save the updated setting
			}
		});
	}

	onunload() {
		if (this.timer) {
			this.timer.cleanup();
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		if (this.timer) {
			this.timer.updateSettings(this.settings);
		}
	}

	get currentDurationIndex() {
		return this.timer?.currentDuration ?? 0;
	}

	set currentDurationIndex(_value: number) {
		// For compatibility with settings tab - setter does nothing
	}

	get workIntervalCount() {
		return this.timer?.workCount ?? 0;
	}

	set workIntervalCount(_value: number) {
		// For compatibility with settings tab - setter does nothing
	}

	resetPomodoroSession() {
		if (this.timer) {
			this.timer.resetToWorkState();
		}
	}

	resetTimer() {
		if (this.timer) {
			this.timer.resetTimer();
		}
	}

	// Test accessors - only used in testing
	get _statusBarItem() {
		return this.statusBarItem;
	}

	get _timer() {
		return this.timer;
	}
}
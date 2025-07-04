import { Plugin } from "obsidian";
import { PomodoroSettings, DEFAULT_SETTINGS } from "./settings";
import { PomodoroSettingTab } from "./settings-tab";
import { PomodoroTimer } from "./timer";

export default class PomodoroPlugin extends Plugin {
	settings: PomodoroSettings;
	private timer: PomodoroTimer;
	private statusBarItem: HTMLElement;

	async onload() {
		await this.loadSettings();

		this.statusBarItem = this.addStatusBarItem();
		this.timer = new PomodoroTimer(this, this.settings, this.statusBarItem);

		this.addSettingTab(new PomodoroSettingTab(this.app, this));
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

	set currentDurationIndex(value: number) {
		// For compatibility with settings tab
	}

	get workIntervalCount() {
		return this.timer?.workCount ?? 0;
	}

	set workIntervalCount(value: number) {
		// For compatibility with settings tab
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
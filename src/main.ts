import { Plugin } from "obsidian";
import { PomodoroSettings, DEFAULT_SETTINGS } from "./types";
import { PomodoroSettingTab } from "./components/SettingsTab";
import { PomodoroTimer } from "./logic/timer";
import { SoundManager } from "./logic/soundManager";

export default class PomodoroPlugin extends Plugin {
	settings!: PomodoroSettings;
	private timer!: PomodoroTimer;
	private soundManager!: SoundManager;
	private statusBarItem!: HTMLElement;

	async onload() {
		await this.loadSettings();

		this.statusBarItem = this.addStatusBarItem();
		this.soundManager = new SoundManager(this, this.settings);
		this.timer = new PomodoroTimer(
			this,
			this.settings,
			this.statusBarItem,
			this.soundManager
		);

		this.addSettingTab(
			new PomodoroSettingTab(this.app, this, this.soundManager)
		);

		// Add commands for keyboard shortcuts
		this.addCommand({
			id: "toggle-timer",
			name: "Toggle timer",
			callback: () => {
				if (this.timer) {
					this.timer.toggleTimer();
				}
			},
		});

		this.addCommand({
			id: "reset-timer",
			name: "Reset current timer",
			callback: () => {
				if (this.timer && !this.timer.isRunning) {
					this.timer.resetTimer();
				}
			},
		});

		this.addCommand({
			id: "cycle-timer",
			name: "Cycle to next timer duration",
			callback: () => {
				if (this.timer && !this.timer.isRunning) {
					this.timer.cycleDuration();
				}
			},
		});

		this.addCommand({
			id: "toggle-icon-visibility",
			name: "Toggle timer icon visibility",
			callback: () => {
				this.settings.showIcon = !this.settings.showIcon;
				this.saveSettings();
			},
		});

		this.addCommand({
			id: "toggle-status-bar",
			name: "Toggle status bar visibility",
			callback: () => {
				this.timer.toggleStatusBarVisibility();
				this.saveSettings(); // Save the updated setting
			},
		});

		this.addCommand({
			id: "toggle-sound-notifications",
			name: "Toggle sound notifications",
			callback: () => {
				this.settings.soundEnabled = !this.settings.soundEnabled;
				this.saveSettings();
			},
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
		return this.timer?.timerType ?? 0;
	}

	set currentDurationIndex(_value: number) {
		// For compatibility with settings tab - setter does nothing
	}

	get workIntervalCount() {
		return this.timer?.workIntervalsCount ?? 0;
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

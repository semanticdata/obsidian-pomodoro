import { Plugin } from "obsidian";

interface PomodoroSettings {
	defaultDuration: number;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
	defaultDuration: 25,
};

export default class PomodoroPlugin extends Plugin {
	settings: PomodoroSettings;
	statusBarItem: HTMLElement;
	timer: number | null = null;
	remainingTime: number = 0;
	isRunning: boolean = false;

	async onload() {
		await this.loadSettings();

		// Create status bar item
		this.statusBarItem = this.addStatusBarItem();
		this.updateDisplay();

		// Left click to start/stop
		this.statusBarItem.onClickEvent((e: MouseEvent) => {
			if (this.isRunning) {
				this.pauseTimer();
			} else {
				this.startTimer();
			}
		});

		// Right click to reset (only when paused)
		this.registerDomEvent(
			this.statusBarItem,
			"contextmenu",
			(e: MouseEvent) => {
				e.preventDefault();
				if (!this.isRunning) {
					this.resetTimer();
				}
			}
		);

		// Initialize timer
		this.resetTimer();
	}

	onunload() {
		if (this.timer) {
			window.clearInterval(this.timer);
		}
	}

	startTimer() {
		if (!this.isRunning) {
			this.isRunning = true;
			this.timer = window.setInterval(() => {
				if (this.remainingTime > 0) {
					this.remainingTime--;
					this.updateDisplay();
				} else {
					this.pauseTimer();
				}
			}, 1000);
		}
	}

	pauseTimer() {
		if (this.timer) {
			window.clearInterval(this.timer);
			this.timer = null;
		}
		this.isRunning = false;
	}

	resetTimer() {
		this.remainingTime = this.settings.defaultDuration * 60;
		this.updateDisplay();
	}

	updateDisplay() {
		const minutes = Math.floor(this.remainingTime / 60);
		const seconds = this.remainingTime % 60;
		this.statusBarItem.setText(
			`${minutes.toString().padStart(2, "0")}:${seconds
				.toString()
				.padStart(2, "0")}`
		);
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
	}
}

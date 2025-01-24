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
	durationCycle: number[] = [25, 15, 5]; // Array to hold the durations
	currentDurationIndex: number = 0; // Index to track the current duration

	async onload() {
		await this.loadSettings();

		// Create status bar item
		this.statusBarItem = this.addStatusBarItem();
		this.statusBarItem.addClass("pomodoro-timer");
		this.updateDisplay();

		// Left click to start/stop
		this.statusBarItem.onClickEvent((e: MouseEvent) => {
			if (e.button === 0) {
				// Check for left click
				if (this.isRunning) {
					this.pauseTimer();
				} else {
					this.startTimer();
				}
			}
		});

		// Middle click to cycle through durations
		this.statusBarItem.onClickEvent((e: MouseEvent) => {
			if (e.button === 1) {
				// Check for middle click
				this.cycleDuration();
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
			this.statusBarItem.addClass("active");
			this.statusBarItem.removeClass("break");
			this.timer = window.setInterval(() => {
				if (this.remainingTime > 0) {
					this.remainingTime--;
					this.updateDisplay();
				} else {
					this.pauseTimer();
					if (this.currentDurationIndex === 0) {
						this.currentDurationIndex = 1;
						this.statusBarItem.addClass("break");
					} else {
						this.currentDurationIndex = 0;
						this.statusBarItem.removeClass("break");
					}
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
		this.statusBarItem.removeClass("active");
		this.statusBarItem.addClass("paused");
	}

	resetTimer() {
		this.remainingTime = this.durationCycle[this.currentDurationIndex] * 60;
		this.statusBarItem.removeClass("active");
		this.statusBarItem.removeClass("paused");
		this.updateDisplay();
	}

	cycleDuration() {
		// Prevent changing duration if the timer is running or paused
		if (this.isRunning) {
			return; // Do nothing if the timer is running
		}
		this.currentDurationIndex =
			(this.currentDurationIndex + 1) % this.durationCycle.length;
		this.resetTimer(); // Reset timer to the new duration
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

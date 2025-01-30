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
	remainingTime = 0;
	isRunning = false;
	durationCycle: number[] = [25, 15, 5]; // Array to hold the durations
	currentDurationIndex = 0; // Index to track the current duration

	async onload() {
		await this.loadSettings();

		// Create status bar item
		this.statusBarItem = this.addStatusBarItem();
		this.statusBarItem.addClass("pomodoro-timer");
		this.updateDisplay();

		// Improved click handling
		this.statusBarItem.onClickEvent((e: MouseEvent) => {
			switch (e.button) {
				case 0: // Left click
					this.isRunning ? this.pauseTimer() : this.startTimer();
					break;
				case 1: // Middle click
					this.cycleDuration();
					break;
				case 2: // Right click
					e.preventDefault();
					if (!this.isRunning) {
						this.resetTimer();
					}
					break;
			}
		});

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
			this.timer = window.setInterval(() => {
				if (this.remainingTime > 0) {
					this.remainingTime--;
					this.updateDisplay();
				} else {
					this.pauseTimer();
					alert(
						"PomoBar: Time's up! Your most recent timer has finished."
					);
					this.currentDurationIndex =
						(this.currentDurationIndex + 1) %
						this.durationCycle.length;
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
		// this.remainingTime = 2; // Set to 2 seconds for testing
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

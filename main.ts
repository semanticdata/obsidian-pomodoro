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

		// Register event handlers using Obsidian's event registration system
		// Note: These will show linter errors until the project is properly set up with Obsidian types
		// @ts-ignore - Ignoring TypeScript errors as the methods exist in the Obsidian Plugin class
		this.registerDomEvent(this.statusBarItem, 'click', (e: MouseEvent) => {
			if (e.button === 0) { // Left click
				this.isRunning ? this.pauseTimer() : this.startTimer();
			}
		});

		// @ts-ignore - Ignoring TypeScript errors as the methods exist in the Obsidian Plugin class
		this.registerDomEvent(this.statusBarItem, 'auxclick', (e: MouseEvent) => {
			if (e.button === 1) { // Middle click
				this.cycleDuration();
			}
		});

		// @ts-ignore - Ignoring TypeScript errors as the methods exist in the Obsidian Plugin class
		this.registerDomEvent(this.statusBarItem, 'contextmenu', (e: MouseEvent) => {
			e.preventDefault();
			if (!this.isRunning) {
				this.resetTimer();
			}
		});

		// Initialize timer
		this.resetTimer();
	}

	onunload() {
		// No need to manually clear event listeners - Obsidian's registerDomEvent handles this
		if (this.timer) {
			window.clearInterval(this.timer);
		}
	}

	startTimer() {
		if (!this.isRunning) {
			this.isRunning = true;
			this.statusBarItem.addClass("active");
			
			// Use setInterval for the timer
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
			
			// Register the interval with Obsidian to automatically clean up when plugin unloads
			// @ts-ignore - Ignoring TypeScript errors as the methods exist in the Obsidian Plugin class
			this.registerInterval(this.timer);
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
			// @ts-ignore - Ignoring TypeScript errors as the methods exist in the Obsidian Plugin class
			await this.loadData()
		);
	}

	async saveSettings() {
		// @ts-ignore - Ignoring TypeScript errors as the methods exist in the Obsidian Plugin class
		await this.saveData(this.settings);
	}
}

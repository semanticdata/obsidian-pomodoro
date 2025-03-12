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
	remainingTime = 0;
	isRunning = false;
	durationCycle: number[] = [25, 15, 5];
	currentDurationIndex = 0;
	private currentInterval: number | null = null;

	async onload() {
		await this.loadSettings();

		// Create status bar item
		this.statusBarItem = this.addStatusBarItem();
		this.statusBarItem.addClass("pomodoro-timer");
		this.updateDisplay();

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

	startTimer() {
		if (!this.isRunning) {
			this.isRunning = true;
			this.statusBarItem.addClass("active");
			this.statusBarItem.removeClass("paused");

			// Create the interval and store its ID
			const intervalId = window.setInterval(() => {
				if (this.remainingTime > 0) {
					this.remainingTime--;
					this.updateDisplay();
				} else {
					this.pauseTimer();
					alert("PomoBar: Time's up! Your most recent timer has finished.");
					this.currentDurationIndex =
						(this.currentDurationIndex + 1) % this.durationCycle.length;
					this.resetTimer();
				}
			}, 1000);

			// Store the current interval ID
			this.currentInterval = intervalId;

			// Register with Obsidian for cleanup on unload
			this.registerInterval(intervalId);
		}
	}

	pauseTimer() {
		if (this.currentInterval) {
			window.clearInterval(this.currentInterval);
			this.currentInterval = null;
		}
		this.isRunning = false;
		this.statusBarItem.removeClass("active");
		this.statusBarItem.addClass("paused");
	}

	resetTimer() {
		if (this.currentInterval) {
			window.clearInterval(this.currentInterval);
			this.currentInterval = null;
		}
		this.isRunning = false;
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
			// @ts-ignore - Ignoring TypeScript errors as the methods exist in the Obsidian Plugin class
			await this.loadData()
		);
	}

	async saveSettings() {
		// @ts-ignore - Ignoring TypeScript errors as the methods exist in the Obsidian Plugin class
		await this.saveData(this.settings);
	}
}

import { Plugin } from "obsidian";
import { PomodoroSettings } from "./settings";
import { ICONS_MAP } from "./icons";

export class PomodoroTimer {
	private plugin: Plugin;
	private settings: PomodoroSettings;
	private statusBarItem: HTMLElement;
	private remainingTime = 0;
	private isRunning = false;
	private currentDurationIndex = 0;
	private workIntervalCount = 0;
	private currentInterval: number | null = null;

	constructor(plugin: Plugin, settings: PomodoroSettings, statusBarItem: HTMLElement) {
		this.plugin = plugin;
		this.settings = settings;
		this.statusBarItem = statusBarItem;
		this.setupStatusBar();
		this.resetTimer();
	}

	private setupStatusBar() {
		this.statusBarItem.classList.add("pomodoro-timer");
		
		const iconContainer = document.createElement("span");
		iconContainer.classList.add("pomodoro-icon");
		iconContainer.innerHTML = ICONS_MAP['pomobar-timer'];
		this.statusBarItem.appendChild(iconContainer);
		
		const textContainer = document.createElement("span");
		textContainer.classList.add("pomodoro-text");
		this.statusBarItem.appendChild(textContainer);
		
		this.statusBarItem.addEventListener('click', (e: MouseEvent) => {
			if (e.button === 0) {
				this.isRunning ? this.pauseTimer() : this.startTimer();
			}
		});

		this.statusBarItem.addEventListener('auxclick', (e: MouseEvent) => {
			if (e.button === 1) {
				this.cycleDuration();
			}
		});

		this.statusBarItem.addEventListener('contextmenu', (e: MouseEvent) => {
			e.preventDefault();
			if (!this.isRunning) {
				this.resetTimer();
			}
		});
	}

	updateSettings(settings: PomodoroSettings) {
		this.settings = settings;
		this.resetTimer();
	}

	startTimer() {
		if (!this.isRunning) {
			this.isRunning = true;
			this.statusBarItem.classList.add("active");
			this.statusBarItem.classList.remove("paused");

			const intervalId = window.setInterval(() => {
				if (this.remainingTime > 0) {
					this.remainingTime--;
					this.updateDisplay();
				} else {
					alert("PomoBar: Time's up! Your most recent timer has finished.");
					
					if (this.currentDurationIndex === 0) {
						this.workIntervalCount++;
						if (this.workIntervalCount >= this.settings.intervalsBeforeLongBreak) {
							this.currentDurationIndex = 2;
							this.workIntervalCount = 0;
						} else {
							this.currentDurationIndex = 1;
						}
					} else {
						this.currentDurationIndex = 0;
					}
					this.resetTimer();
					this.pauseTimer();
				}
			}, 1000);

			this.currentInterval = intervalId;
			this.plugin.registerInterval(intervalId);
		}
	}

	pauseTimer() {
		if (this.currentInterval) {
			window.clearInterval(this.currentInterval);
			this.currentInterval = null;
		}
		this.isRunning = false;
		this.statusBarItem.classList.remove("active");
		this.statusBarItem.classList.add("paused");
	}

	resetTimer() {
		if (this.currentInterval) {
			window.clearInterval(this.currentInterval);
			this.currentInterval = null;
		}
		this.isRunning = false;
		
		if (this.currentDurationIndex === 0) {
			this.remainingTime = this.settings.workTime * 60;
		} else if (this.currentDurationIndex === 1) {
			this.remainingTime = this.settings.shortBreakTime * 60;
		} else {
			this.remainingTime = this.settings.longBreakTime * 60;
		}
		
		this.statusBarItem.classList.remove("active");
		this.statusBarItem.classList.remove("paused");
		this.updateDisplay();
	}

	cycleDuration() {
		if (this.isRunning) {
			return;
		}
		
		if (this.currentDurationIndex === 0) {
			this.currentDurationIndex = 1;
		} else if (this.currentDurationIndex === 1) {
			this.currentDurationIndex = 2;
		} else {
			this.currentDurationIndex = 0;
		}
		this.workIntervalCount = 0;
		this.resetTimer();
	}

	private updateDisplay() {
		const minutes = Math.floor(this.remainingTime / 60);
		const seconds = this.remainingTime % 60;
		const textEl = this.statusBarItem.querySelector('.pomodoro-text');
		if (textEl) {
			textEl.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
		}
	}

	get currentDuration() {
		return this.currentDurationIndex;
	}

	get workCount() {
		return this.workIntervalCount;
	}

	get running() {
		return this.isRunning;
	}

	get timeRemaining() {
		return this.remainingTime;
	}
}
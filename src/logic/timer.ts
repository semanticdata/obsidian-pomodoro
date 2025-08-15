import { Plugin, Notice } from "obsidian";
import { PomodoroSettings } from "../types";
import { ICONS_MAP } from "../icons";
import { TIMER_STATES, TIMER_INTERVAL_MS, CSS_CLASSES, MOUSE_BUTTONS } from "../constants";

export class PomodoroTimer {
	private plugin: Plugin;
	private settings: PomodoroSettings;
	private statusBarItem: HTMLElement;
	private remainingTime = 0;
	private isRunning = false;
	private currentDurationIndex = 0;
	private workIntervalCount = 0;
	private currentInterval: number | null = null;
	private registeredIntervals: Set<number> = new Set();

	constructor(plugin: Plugin, settings: PomodoroSettings, statusBarItem: HTMLElement) {
		this.plugin = plugin;
		this.settings = settings;
		this.statusBarItem = statusBarItem;
		this.setupStatusBar();
		this.resetTimer();
	}

	private setupStatusBar() {
		this.statusBarItem.classList.add(CSS_CLASSES.TIMER);

		// Create icon container - will be shown/hidden based on settings
		const iconContainer = document.createElement("span");
		iconContainer.classList.add(CSS_CLASSES.ICON);
		iconContainer.innerHTML = ICONS_MAP['pomobar-timer'];
		this.statusBarItem.appendChild(iconContainer);

		// Create text container
		const textContainer = document.createElement("span");
		textContainer.classList.add(CSS_CLASSES.TEXT);
		this.statusBarItem.appendChild(textContainer);

		// Set initial visibility
		this.updateIconVisibility();
		this.updateStatusBarVisibility();

		// Event listeners
		this.plugin.registerDomEvent(this.statusBarItem, 'click', (e: MouseEvent) => {
			if (e.button === MOUSE_BUTTONS.LEFT_CLICK) {
				this.isRunning ? this.pauseTimer() : this.startTimer();
			}
		});

		this.plugin.registerDomEvent(this.statusBarItem, 'auxclick', (e: MouseEvent) => {
			if (e.button === MOUSE_BUTTONS.MIDDLE_CLICK) {
				this.cycleDuration();
			}
		});

		this.plugin.registerDomEvent(this.statusBarItem, 'contextmenu', (e: MouseEvent) => {
			e.preventDefault();
			if (!this.isRunning) {
				this.resetTimer();
			}
		});
	}

	private updateIconVisibility() {
		const iconContainer = this.statusBarItem.querySelector(`.${CSS_CLASSES.ICON}`) as HTMLElement;
		if (iconContainer) {
			if (this.settings.showIcon) {
				iconContainer.style.display = '';
				this.statusBarItem.classList.remove(CSS_CLASSES.NO_ICON);
			} else {
				iconContainer.style.display = 'none';
				this.statusBarItem.classList.add(CSS_CLASSES.NO_ICON);
			}
		}
	}

	private updateStatusBarVisibility() {
		if (this.settings.showInStatusBar) {
			this.statusBarItem.style.display = '';
		} else {
			this.statusBarItem.style.display = 'none';
		}
	}

	updateSettings(settings: PomodoroSettings) {
		this.settings = settings;
		this.updateIconVisibility();
		this.updateStatusBarVisibility();
		this.resetTimer();
	}

	startTimer() {
		if (!this.isRunning) {
			this.isRunning = true;
			this.statusBarItem.classList.add(CSS_CLASSES.ACTIVE);
			this.statusBarItem.classList.remove(CSS_CLASSES.PAUSED);

			const intervalId = window.setInterval(() => {
				if (this.remainingTime > 0) {
					this.remainingTime--;
					this.updateDisplay();
				} else {
					new Notice("PomoBar: Time's up! Your most recent timer has finished.", 5000);

					if (this.currentDurationIndex === TIMER_STATES.WORK) {
						this.workIntervalCount++;
						if (this.workIntervalCount >= this.settings.intervalsBeforeLongBreak) {
							this.currentDurationIndex = TIMER_STATES.LONG_BREAK;
							this.workIntervalCount = 0;
						} else {
							this.currentDurationIndex = TIMER_STATES.SHORT_BREAK;
						}
					} else {
						this.currentDurationIndex = TIMER_STATES.WORK;
					}
					this.resetTimer();
					this.pauseTimer();
				}
			}, TIMER_INTERVAL_MS);

			this.currentInterval = intervalId;
			this.registeredIntervals.add(intervalId);
			this.plugin.registerInterval(intervalId);
		}
	}

	private clearCurrentInterval() {
		if (this.currentInterval) {
			window.clearInterval(this.currentInterval);
			this.registeredIntervals.delete(this.currentInterval);
			this.currentInterval = null;
		}
	}

	pauseTimer() {
		this.clearCurrentInterval();
		this.isRunning = false;
		this.statusBarItem.classList.remove(CSS_CLASSES.ACTIVE);
		this.statusBarItem.classList.add(CSS_CLASSES.PAUSED);
	}

	resetTimer() {
		this.clearCurrentInterval();
		this.isRunning = false;

		if (this.currentDurationIndex === TIMER_STATES.WORK) {
			this.remainingTime = this.settings.workTime * 60;
		} else if (this.currentDurationIndex === TIMER_STATES.SHORT_BREAK) {
			this.remainingTime = this.settings.shortBreakTime * 60;
		} else {
			this.remainingTime = this.settings.longBreakTime * 60;
		}

		this.statusBarItem.classList.remove(CSS_CLASSES.ACTIVE);
		this.statusBarItem.classList.remove(CSS_CLASSES.PAUSED);
		this.updateDisplay();
	}

	cycleDuration() {
		if (this.isRunning) {
			return;
		}

		if (this.currentDurationIndex === TIMER_STATES.WORK) {
			this.currentDurationIndex = TIMER_STATES.SHORT_BREAK;
		} else if (this.currentDurationIndex === TIMER_STATES.SHORT_BREAK) {
			this.currentDurationIndex = TIMER_STATES.LONG_BREAK;
		} else {
			this.currentDurationIndex = TIMER_STATES.WORK;
		}
		// Don't reset work interval count when manually cycling - preserve pomodoro session state
		this.resetTimer();
	}

	private updateDisplay() {
		const minutes = Math.floor(this.remainingTime / 60);
		const seconds = this.remainingTime % 60;
		const textEl = this.statusBarItem.querySelector(`.${CSS_CLASSES.TEXT}`);
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

	resetToWorkState() {
		this.pauseTimer();
		this.currentDurationIndex = TIMER_STATES.WORK;
		this.workIntervalCount = 0;
		this.resetTimer();
	}

	toggleStatusBarVisibility() {
		this.settings.showInStatusBar = !this.settings.showInStatusBar;
		this.updateStatusBarVisibility();
	}

	cleanup() {
		// Clean up any remaining intervals
		this.registeredIntervals.forEach(intervalId => {
			window.clearInterval(intervalId);
		});
		this.registeredIntervals.clear();
		if (this.currentInterval) {
			window.clearInterval(this.currentInterval);
			this.currentInterval = null;
		}
	}
}
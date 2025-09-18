import { moment, Plugin, Notice } from "obsidian";
import { PomodoroSettings } from "../types";
import { ICONS_MAP } from "../icons";
import {
	TIMER_STATES,
	TIMER_INTERVAL_MS,
	CSS_CLASSES,
	MOUSE_BUTTONS,
} from "../constants";
import { SoundManager } from "./soundManager";

export class PomodoroTimer {
	private plugin: Plugin;
	private settings: PomodoroSettings;
	private statusBarItem: HTMLElement;
	private soundManager: SoundManager;
	private timeEnd: moment.Moment | moment.Duration | null = null;
	// Type based state machine:
	// null = OFF
	// Moment = running until (Utc EpochTimeStamp)
	// Duration = paused state, ready for action (Miliseconds)
	private currentDurationIndex = 0;
	private workIntervalCount = 0;
	private currentInterval: number | null = null;
	private registeredIntervals: Set<number> = new Set();

	constructor(
		plugin: Plugin,
		settings: PomodoroSettings,
		statusBarItem: HTMLElement,
		soundManager: SoundManager
	) {
		this.plugin = plugin;
		this.settings = settings;
		this.statusBarItem = statusBarItem;
		this.soundManager = soundManager;
		this.setupStatusBar();
		this.resetTimer();
	}

	private setupStatusBar() {
		this.statusBarItem.classList.add(CSS_CLASSES.TIMER);

		// Create icon container - will be shown/hidden based on settings
		const iconContainer = document.createElement("span");
		iconContainer.classList.add(CSS_CLASSES.ICON);
		iconContainer.innerHTML = ICONS_MAP["pomobar-timer"];
		this.statusBarItem.appendChild(iconContainer);

		// Create text container
		const textContainer = document.createElement("span");
		textContainer.classList.add(CSS_CLASSES.TEXT);
		this.statusBarItem.appendChild(textContainer);

		// Set initial visibility and icon
		this.updateIconVisibility();
		this.updateStatusBarVisibility();
		this.updateIcon();

		// Event listeners
		this.plugin.registerDomEvent(
			this.statusBarItem,
			"click",
			(e: MouseEvent) => {
				if (e.button === MOUSE_BUTTONS.LEFT_CLICK) {
					this.toggleTimer();
				}
			}
		);

		this.plugin.registerDomEvent(
			this.statusBarItem,
			"auxclick",
			(e: MouseEvent) => {
				if (e.button === MOUSE_BUTTONS.MIDDLE_CLICK) {
					this.cycleDuration();
				}
			}
		);

		this.plugin.registerDomEvent(
			this.statusBarItem,
			"contextmenu",
			(e: MouseEvent) => {
				e.preventDefault();
				if (!this.isRunning) {
					this.resetTimer();
				}
			}
		);
	}

	private updateIconVisibility() {
		const iconContainer = this.statusBarItem.querySelector(
			`.${CSS_CLASSES.ICON}`
		) as HTMLElement;
		if (iconContainer) {
			if (this.settings.showIcon) {
				iconContainer.style.display = "";
				this.statusBarItem.classList.remove(CSS_CLASSES.NO_ICON);
			} else {
				iconContainer.style.display = "none";
				this.statusBarItem.classList.add(CSS_CLASSES.NO_ICON);
			}
		}
	}

	private updateStatusBarVisibility() {
		if (this.settings.showInStatusBar) {
			this.statusBarItem.style.display = "";
		} else {
			this.statusBarItem.style.display = "none";
		}
	}

	private isAtDefaultDuration(): boolean {
		// Check if the timer is at its fresh/default duration for the current state
		if (this.currentDurationIndex === TIMER_STATES.WORK) {
			return (
				this.timeEnd?.toISOString() ===
				moment
					.duration(this.settings.workMinutes, "minutes")
					.toISOString()
			);
		} else if (this.currentDurationIndex === TIMER_STATES.SHORT_BREAK) {
			return (
				this.timeEnd?.toISOString() ===
				moment
					.duration(this.settings.shortBreakMinutes, "minutes")
					.toISOString()
			);
		} else if (this.currentDurationIndex === TIMER_STATES.LONG_BREAK) {
			return (
				this.timeEnd?.toISOString() ===
				moment
					.duration(this.settings.longBreakMinutes, "minutes")
					.toISOString()
			);
		}
		return false;
	}

	private updateIcon() {
		const iconContainer = this.statusBarItem.querySelector(
			`.${CSS_CLASSES.ICON}`
		) as HTMLElement;
		if (iconContainer) {
			let iconKey = "pomobar-timer";

			if (this.isRunning) {
				iconKey = "pomobar-timer-pause"; // Running state
			} else if (this.timeEnd === null) {
				// Timer disabled
				iconKey = "pomobar-timer-off";
			} else if (moment.isDuration(this.timeEnd)) {
				// Paused state (Duration)
				if (this.isAtDefaultDuration()) {
					iconKey = "pomobar-timer"; // Fresh timer at default duration
				} else {
					iconKey = "pomobar-timer-play"; // Paused with time left
				}
			}

			iconContainer.innerHTML = ICONS_MAP[iconKey];
		}
	}

	private updateDisplay(time?: moment.Duration) {
		const textEl = this.statusBarItem.querySelector(`.${CSS_CLASSES.TEXT}`);
		if (!time) {
			time = this.timeRemaining;
		}
		if (textEl) {
			textEl.textContent = `${time.minutes()}:${time
				.seconds()
				.toString()
				.padStart(2, "0")}`;
		}
	}

	private getCurrentTimerDuration(): moment.Duration {
		if (this.currentDurationIndex === TIMER_STATES.WORK) {
			return moment.duration(this.settings.workMinutes, "minutes");
		} else if (this.currentDurationIndex === TIMER_STATES.SHORT_BREAK) {
			return moment.duration(this.settings.shortBreakMinutes, "minutes");
		} else {
			return moment.duration(this.settings.longBreakMinutes, "minutes");
		}
	}

	updateSettings(settings: PomodoroSettings) {
		this.settings = settings;
		this.soundManager.updateSettings(settings);
		this.updateIconVisibility();
		this.updateStatusBarVisibility();
		this.updateIcon();
		this.resetTimer();
	}

	toggleTimer() {
		if (!this.isRunning) {
			this.timeEnd = moment.utc(moment.now()).add(this.timeRemaining);

			const intervalId = window.setInterval(() => {
				const time = this.timeRemaining;
				this.updateDisplay(time);
				if (time.asMilliseconds() > 0) {
					null;
				} else {
					if (this.settings.autoProgressEnabled) {
						// Continue running - start the next timer automatically
						this.advanceTimer();

						this.soundManager.playCompletionSound();
						new Notice(
							"PomoBar: Time's up! Your most recent timer has finished.",
							10000
						);
					} else if (this.settings.persistentNotification) {
						// Keep on chiming until user interacts with the timer
						this.soundManager.playCompletionSound();
						new Notice(
							"PomoBar: Time's up! Your most recent timer has finished.",
							1000
						);
					} else {
						// Current behavior - pause after timer completion
						// this.resetTimer();
						this.advanceTimer();
						this.pauseTimer();
					}
				}
			}, TIMER_INTERVAL_MS);

			this.currentInterval = intervalId;
			this.registeredIntervals.add(intervalId);
			this.plugin.registerInterval(intervalId);

			this.statusBarItem.classList.add(CSS_CLASSES.ACTIVE);
			this.statusBarItem.classList.remove(CSS_CLASSES.PAUSED);
			this.updateDisplay();
			this.updateIcon();
		} else if (this.timeRemaining.asMilliseconds() < 0) {
			this.advanceTimer();
		} else {
			this.pauseTimer();
		}
	}

	private clearCurrentInterval() {
		if (this.currentInterval) {
			console.log("Cleared interval", this.currentInterval);
			window.clearInterval(this.currentInterval);
			this.registeredIntervals.delete(this.currentInterval);
			this.currentInterval = null;
		}
	}

	advanceTimer() {
		if (this.currentDurationIndex === TIMER_STATES.WORK) {
			this.workIntervalCount++;
			if (
				this.workIntervalCount >= this.settings.intervalsBeforeLongBreak
			) {
				this.currentDurationIndex = TIMER_STATES.LONG_BREAK;
				this.workIntervalCount = 0;
			} else {
				this.currentDurationIndex = TIMER_STATES.SHORT_BREAK;
			}
		} else {
			this.currentDurationIndex = TIMER_STATES.WORK;
		}
		this.timeEnd = moment
			.utc(moment.now())
			.add(this.getCurrentTimerDuration());
	}

	pauseTimer() {
		this.clearCurrentInterval();
		this.timeEnd = this.timeRemaining;
		this.statusBarItem.classList.remove(CSS_CLASSES.ACTIVE);
		this.statusBarItem.classList.add(CSS_CLASSES.PAUSED);
		this.updateDisplay();
		this.updateIcon();
	}

	resetTimer() {
		this.clearCurrentInterval();
		this.soundManager.stopCurrentAudio();
		this.timeEnd = null;

		this.statusBarItem.classList.remove(CSS_CLASSES.ACTIVE);
		this.statusBarItem.classList.remove(CSS_CLASSES.PAUSED);
		this.updateDisplay();
		this.updateIcon();
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

	get timerType() {
		return this.currentDurationIndex;
	}

	get workIntervalsCount() {
		return this.workIntervalCount;
	}

	get isRunning() {
		return (
			//moment.isMoment(this.timeEnd)
			this.currentInterval != null
		);
	}

	get timeRemaining(): moment.Duration {
		if (moment.isMoment(this.timeEnd)) {
			// RUNNING state
			return moment.duration(
				this.timeEnd.diff(moment.now(), "milliseconds")
			);
		} else if (moment.isDuration(this.timeEnd)) {
			// PAUSED state
			return this.timeEnd;
		}

		// OFF state
		return this.getCurrentTimerDuration();
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
		this.registeredIntervals.forEach((intervalId) => {
			window.clearInterval(intervalId);
		});
		this.registeredIntervals.clear();
		if (this.currentInterval) {
			window.clearInterval(this.currentInterval);
			this.currentInterval = null;
		}

		// Clean up sound manager
		this.soundManager.cleanup();
	}

	// Test accessors - only used for testing private properties
	get _isRunning(): boolean {
		return this.isRunning;
	}

	set _isRunning(value: boolean) {
		if (value) {
			this.clearCurrentInterval();
			this.toggleTimer();
		} else {
			this.resetTimer();
		}
	}

	get _currentDurationIndex(): number {
		return this.currentDurationIndex;
	}

	set _currentDurationIndex(value: number) {
		this.currentDurationIndex = value;
	}

	get _workIntervalCount(): number {
		return this.workIntervalCount;
	}

	set _workIntervalCount(value: number) {
		this.workIntervalCount = value;
	}

	get _timeRemaining(): moment.Duration {
		return this.timeRemaining;
	}

	set _timeEnd(value: moment.Moment | moment.Duration | number) {
		if (moment.isMoment(value)) {
			this.timeEnd = value;
		} else if (moment.isDuration(this.timeEnd)) {
			this.timeEnd = moment.utc(moment.now()).add(value);
		} else {
			this.timeEnd = moment.utc(moment.now()).add(value, "seconds");
		}
	}

	_isAtDefaultDuration() {
		return this.isAtDefaultDuration();
	}
}

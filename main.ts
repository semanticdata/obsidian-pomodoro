import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

interface PomodoroSettings {
	workTime: number;
	shortBreakTime: number;
	longBreakTime: number;
	intervalsBeforeLongBreak: number;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
	workTime: 25,
	shortBreakTime: 5,
	longBreakTime: 15,
	intervalsBeforeLongBreak: 4,
};

export default class PomodoroPlugin extends Plugin {
	settings: PomodoroSettings;
	statusBarItem: HTMLElement;
	remainingTime = 0;
	isRunning = false;
	currentDurationIndex = 0; // 0: work, 1: short break, 2: long break
	workIntervalCount = 0;
	private get currentCycle(): number[] {
		// This will be dynamically determined based on workIntervalCount
		// For now, let's keep it simple and adjust in the timer logic
		return [this.settings.workTime, this.settings.shortBreakTime, this.settings.longBreakTime];
	}
	private currentInterval: number | null = null;

	async onload() {
		await this.loadSettings();

		// Create status bar item
		this.statusBarItem = this.addStatusBarItem();
		this.statusBarItem.classList.add("pomodoro-timer");
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

		// Add settings tab
		this.addSettingTab(new PomodoroSettingTab(this.app, this));
	}

	startTimer() {
		if (!this.isRunning) {
			this.isRunning = true;
			this.statusBarItem.classList.add("active");
			this.statusBarItem.classList.remove("paused");

			// Create the interval and store its ID
			const intervalId = window.setInterval(() => {
				if (this.remainingTime > 0) {
					this.remainingTime--;
					this.updateDisplay();
				} else {
					alert("PomoBar: Time's up! Your most recent timer has finished.");
					// Determine next state
					if (this.currentDurationIndex === 0) { // If it was a work timer
						this.workIntervalCount++;
						if (this.workIntervalCount >= this.settings.intervalsBeforeLongBreak) {
							this.currentDurationIndex = 2; // Long break
							this.workIntervalCount = 0; // Reset counter
						} else {
							this.currentDurationIndex = 1; // Short break
						}
					} else { // If it was a break timer (short or long)
						this.currentDurationIndex = 0; // Go back to work
					}
					this.resetTimer();
					this.pauseTimer(); // Pause after state update and reset
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
		this.statusBarItem.classList.remove("active");
		this.statusBarItem.classList.add("paused");
	}

	resetTimer() {
		if (this.currentInterval) {
			window.clearInterval(this.currentInterval);
			this.currentInterval = null;
		}
		this.isRunning = false;
		// Determine the correct duration based on the currentDurationIndex
		if (this.currentDurationIndex === 0) {
			this.remainingTime = this.settings.workTime * 60;
		} else if (this.currentDurationIndex === 1) {
			this.remainingTime = this.settings.shortBreakTime * 60;
		} else { // currentDurationIndex === 2
			this.remainingTime = this.settings.longBreakTime * 60;
		}
		this.statusBarItem.classList.remove("active");
		this.statusBarItem.classList.remove("paused");
		this.updateDisplay();
	}

	cycleDuration() {
		// Prevent changing duration if the timer is running or paused
		if (this.isRunning) {
			return; // Do nothing if the timer is running
		}
		// Cycle through Work -> Short Break -> Work -> Short Break ... -> Long Break
		// This logic is now primarily handled when a timer finishes.
		// For manual cycling via middle click, we can simplify it or make it smarter.
		// Let's make it cycle W -> SB -> LB -> W for simplicity if manually triggered when not running.
		if (this.currentDurationIndex === 0) {
			this.currentDurationIndex = 1; // Go to Short Break
		} else if (this.currentDurationIndex === 1) {
			this.currentDurationIndex = 2; // Go to Long Break
		} else { // currentDurationIndex === 2
			this.currentDurationIndex = 0; // Go to Work
		}
		this.workIntervalCount = 0; // Reset work interval count if manually cycled
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

class PomodoroSettingTab extends PluginSettingTab {
	plugin: PomodoroPlugin;

	constructor(app: App, plugin: PomodoroPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h1", { text: "PomoBar" });

		new Setting(containerEl)
			.setName("Work Duration")
			.setDesc("Duration of the work timer in minutes.")
			.addText(text => text
				.setPlaceholder("e.g., 25")
				.setValue(this.plugin.settings.workTime.toString())
				.onChange(async (value) => {
					const duration = parseInt(value.trim());
					if (!isNaN(duration) && duration > 0) {
						this.plugin.settings.workTime = duration;
						await this.plugin.saveSettings();
						this.plugin.resetTimer();
					}
				}));

		new Setting(containerEl)
			.setName("Short Break Duration")
			.setDesc("Duration of the short break timer in minutes.")
			.addText(text => text
				.setPlaceholder("e.g., 5")
				.setValue(this.plugin.settings.shortBreakTime.toString())
				.onChange(async (value) => {
					const duration = parseInt(value.trim());
					if (!isNaN(duration) && duration > 0) {
						this.plugin.settings.shortBreakTime = duration;
						await this.plugin.saveSettings();
						this.plugin.resetTimer();
					}
				}));

		new Setting(containerEl)
			.setName("Long Break Duration")
			.setDesc("Duration of the long break timer in minutes.")
			.addText(text => text
				.setPlaceholder("e.g., 15")
				.setValue(this.plugin.settings.longBreakTime.toString())
				.onChange(async (value) => {
					const duration = parseInt(value.trim());
					if (!isNaN(duration) && duration > 0) {
						this.plugin.settings.longBreakTime = duration;
						await this.plugin.saveSettings();
						this.plugin.resetTimer();
					}
				}));

		new Setting(containerEl)
			.setName("Intervals Before Long Break")
			.setDesc("Number of work intervals before a long break is triggered.")
			.addText(text => text
				.setPlaceholder("e.g., 4")
				.setValue(this.plugin.settings.intervalsBeforeLongBreak.toString())
				.onChange(async (value) => {
					const intervals = parseInt(value.trim());
					if (!isNaN(intervals) && intervals > 0) {
						this.plugin.settings.intervalsBeforeLongBreak = intervals;
						await this.plugin.saveSettings();
						this.plugin.workIntervalCount = 0; // Reset counter with new setting
						this.plugin.currentDurationIndex = 0; // Start with work timer
						this.plugin.resetTimer();
					}
				}));
	}
}

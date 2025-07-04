import { App, PluginSettingTab, Setting } from "obsidian";
import type PomodoroPlugin from "./plugin";

export class PomodoroSettingTab extends PluginSettingTab {
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
						this.plugin.workIntervalCount = 0;
						this.plugin.currentDurationIndex = 0;
						this.plugin.resetTimer();
					}
				}));
	}
}
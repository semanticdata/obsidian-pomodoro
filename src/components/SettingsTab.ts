import { App, PluginSettingTab, Setting } from "obsidian";
import type PomodoroPlugin from "../main";
import { PLUGIN_NAME } from "../constants";
import { SoundManager } from "../logic/soundManager";

export class PomodoroSettingTab extends PluginSettingTab {
	plugin: PomodoroPlugin;
	soundManager: SoundManager;
	private customSoundSetting?: Setting;

	constructor(app: App, plugin: PomodoroPlugin, soundManager: SoundManager) {
		super(app, plugin);
		this.plugin = plugin;
		this.soundManager = soundManager;
	}

	private validateAndUpdateSetting(
		value: string,
		settingProperty: "workMinutes" | "shortBreakMinutes" | "longBreakMinutes" | "intervalsBeforeLongBreak",
		resetAction: "resetTimer" | "resetPomodoroSession"
	): boolean {
		const numValue = parseInt(value.trim());
		if (!isNaN(numValue) && numValue > 0 && Number.isInteger(Number(value.trim()))) {
			this.plugin.settings[settingProperty] = numValue;
			this.plugin.saveSettings();
			if (resetAction === 'resetTimer') {
				this.plugin.resetTimer();
			} else {
				this.plugin.resetPomodoroSession();
			}
			return true;
		}
		return false;
	}

	private updateCustomSoundVisibility(show: boolean): void {
		if (this.customSoundSetting && this.customSoundSetting.settingEl) {
			this.customSoundSetting.settingEl.style.display = show ? '' : 'none';
		}
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl).setName(PLUGIN_NAME).setHeading();

		new Setting(containerEl)
			.setName("Work Duration")
			.setDesc("Duration of the work timer in minutes.")
			.addText(text => text
				.setPlaceholder("e.g., 25")
				.setValue(this.plugin.settings.workMinutes.toString())
				.onChange(async (value) => {
					await this.validateAndUpdateSetting(value, "workMinutes", "resetTimer");
				}));

		new Setting(containerEl)
			.setName("Short Break Duration")
			.setDesc("Duration of the short break timer in minutes.")
			.addText(text => text
				.setPlaceholder("e.g., 5")
				.setValue(this.plugin.settings.shortBreakMinutes.toString())
				.onChange(async (value) => {
					await this.validateAndUpdateSetting(value, "shortBreakMinutes", "resetTimer");
				}));

		new Setting(containerEl)
			.setName("Long Break Duration")
			.setDesc("Duration of the long break timer in minutes.")
			.addText(text => text
				.setPlaceholder("e.g., 15")
				.setValue(this.plugin.settings.longBreakMinutes.toString())
				.onChange(async (value) => {
					await this.validateAndUpdateSetting(value, "longBreakMinutes", "resetTimer");
				}));

		new Setting(containerEl)
			.setName("Intervals Before Long Break")
			.setDesc("Number of work intervals before a long break is triggered.")
			.addText(text => text
				.setPlaceholder("e.g., 4")
				.setValue(this.plugin.settings.intervalsBeforeLongBreak.toString())
				.onChange(async (value) => {
					await this.validateAndUpdateSetting(value, 'intervalsBeforeLongBreak', 'resetPomodoroSession');
				}));

		new Setting(containerEl)
			.setName("Auto-start Next Timer")
			.setDesc("Automatically start the next timer in the cycle when the current timer completes. When disabled, timers pause after completion.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoProgressEnabled)
				.onChange(async (value) => {
					this.plugin.settings.autoProgressEnabled = value;
					value ? this.plugin.settings.persistentNotification = false : null;
					await this.plugin.saveSettings();
					this.display(); 
				}));

		new Setting(containerEl)
			.setName("Show Timer Icon")
			.setDesc("Display a timer icon next to the countdown in the status bar.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showIcon)
				.onChange(async (value) => {
					this.plugin.settings.showIcon = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Show in Status Bar")
			.setDesc("Toggle the timer's visibility in the status bar. You can also use the 'Toggle status bar visibility' command.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showInStatusBar)
				.onChange(async (value) => {
					this.plugin.settings.showInStatusBar = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl).setName("Sound Notifications").setHeading();

		new Setting(containerEl)
			.setName("Enable Sound Notifications")
			.setDesc("Play a sound when timers complete.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.soundEnabled)
				.onChange(async (value) => {
					this.plugin.settings.soundEnabled = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Persistent Notification")
			.setDesc("Play sound continously, until timer is continued or reset")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.persistentNotification)
				.onChange(async (value) => {
					this.plugin.settings.persistentNotification = value;
					value ? this.plugin.settings.autoProgressEnabled = false : null;
					await this.plugin.saveSettings();
					this.display();
				})
			)

		new Setting(containerEl)
			.setName("Sound Selection")
			.setDesc("Choose a built-in sound or select 'custom' to use your own.")
			.addDropdown(dropdown => {
				const builtInSounds = this.soundManager.getBuiltInSounds();
				builtInSounds.forEach(sound => {
					dropdown.addOption(sound, sound.replace('.wav', ''));
				});
				dropdown.addOption("custom", "Custom");
				
				// Determine current selection
				const currentSelection = this.plugin.settings.customSoundUrl?.trim() ? "custom" : this.plugin.settings.selectedSound;
				dropdown
					.setValue(currentSelection)
					.onChange(async (value) => {
						if (value === "custom") {
							// Don't change selectedSound when switching to custom
							this.updateCustomSoundVisibility(true);
						} else {
							this.plugin.settings.selectedSound = value;
							this.plugin.settings.customSoundUrl = "";
							this.updateCustomSoundVisibility(false);
							await this.plugin.saveSettings();
						}
					});
			})
			.addButton(button => button
				.setButtonText("Preview")
				.onClick(async () => {
					try {
						const isCustomSelected = this.plugin.settings.customSoundUrl?.trim();
						if (isCustomSelected) {
							await this.soundManager.previewSound(this.plugin.settings.customSoundUrl!.trim());
						} else {
							await this.soundManager.previewSound(this.plugin.settings.selectedSound);
						}
					} catch (error) {
						console.warn("Preview failed:", error);
					}
				}));

		const customSoundSetting = new Setting(containerEl)
			.setName("Custom Sound URL/Path")
			.setDesc("Use a custom sound file from your vault or a URL.")
			.addText(text => text
				.setPlaceholder("e.g., MyFolder/custom-sound.mp3 or https://example.com/sound.wav")
				.setValue(this.plugin.settings.customSoundUrl || "")
				.onChange(async (value) => {
					this.plugin.settings.customSoundUrl = value.trim();
					await this.plugin.saveSettings();
				}));

		// Store references for dynamic visibility control
		this.customSoundSetting = customSoundSetting;
		
		// Set initial visibility
		const shouldShowCustom = this.plugin.settings.customSoundUrl?.trim();
		this.updateCustomSoundVisibility(!!shouldShowCustom);

		new Setting(containerEl)
			.setName("Volume")
			.setDesc("Adjust the volume for sound notifications (0-100%).")
			.addSlider(slider => slider
				.setLimits(0, 1, 0.1)
				.setValue(this.plugin.settings.soundVolume)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.soundVolume = value;
					await this.plugin.saveSettings();
				}))
			.addButton(button => button
				.setButtonText("Test Volume")
				.onClick(async () => {
					try {
						const isCustomSelected = this.plugin.settings.customSoundUrl?.trim();
						if (isCustomSelected) {
							await this.soundManager.previewSound(this.plugin.settings.customSoundUrl!.trim());
						} else {
							await this.soundManager.previewSound(this.plugin.settings.selectedSound);
						}
					} catch (error) {
						console.warn("Volume test failed:", error);
					}
				}));
	}
}
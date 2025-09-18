export interface PomodoroSettings {
	workMinutes: number;
	shortBreakMinutes: number;
	longBreakMinutes: number;
	intervalsBeforeLongBreak: number;
	showIcon: boolean;
	showInStatusBar: boolean;
	soundEnabled: boolean;
	persistentNotification: boolean;
	selectedSound: string;
	soundVolume: number;
	customSoundUrl?: string;
	autoProgressEnabled: boolean;
}

export const DEFAULT_SETTINGS: PomodoroSettings = {
	workMinutes: 25,
	shortBreakMinutes: 5,
	longBreakMinutes: 15,
	intervalsBeforeLongBreak: 4,
	showIcon: false,
	showInStatusBar: true,
	soundEnabled: false,
	persistentNotification: false,
	selectedSound: "chime.wav",
	soundVolume: 0.5,
	autoProgressEnabled: false,
};

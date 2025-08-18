export interface PomodoroSettings {
	workTime: number;
	shortBreakTime: number;
	longBreakTime: number;
	intervalsBeforeLongBreak: number;
	showIcon: boolean;
	showInStatusBar: boolean;
	soundEnabled: boolean;
	selectedSound: string;
	soundVolume: number;
	customSoundUrl?: string;
}

export const DEFAULT_SETTINGS: PomodoroSettings = {
	workTime: 25,
	shortBreakTime: 5,
	longBreakTime: 15,
	intervalsBeforeLongBreak: 4,
	showIcon: false,
	showInStatusBar: true,
	soundEnabled: false,
	selectedSound: "chime.wav",
	soundVolume: 0.5,
};
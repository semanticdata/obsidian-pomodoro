export interface PomodoroSettings {
	workTime: number;
	shortBreakTime: number;
	longBreakTime: number;
	intervalsBeforeLongBreak: number;
	showIcon: boolean;
}

export const DEFAULT_SETTINGS: PomodoroSettings = {
	workTime: 25,
	shortBreakTime: 5,
	longBreakTime: 15,
	intervalsBeforeLongBreak: 4,
	showIcon: true,
};
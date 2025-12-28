export const TIMER_STATES = {
	WORK: 0,
	SHORT_BREAK: 1,
	LONG_BREAK: 2,
} as const;

export const TIMER_INTERVAL_MS = 1000;

export const PLUGIN_NAME = "PomoBar";

export const CSS_CLASSES = {
	TIMER: "pomodoro-timer",
	ICON: "pomodoro-icon",
	TEXT: "pomodoro-text",
	ACTIVE: "pomodoro-active",
	PAUSED: "pomodoro-paused",
	NO_ICON: "pomodoro-timer--no-icon",
} as const;

export const MOUSE_BUTTONS = {
	LEFT_CLICK: 0,
	MIDDLE_CLICK: 1,
	RIGHT_CLICK: 2,
} as const;

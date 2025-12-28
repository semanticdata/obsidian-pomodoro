# API Reference

## Plugin Architecture

PomoBar follows the standard Obsidian plugin architecture with three main components working together to provide timer functionality.

## Core Classes

### PomodoroPlugin

Main plugin class that extends Obsidian's `Plugin` base class.

```typescript
class PomodoroPlugin extends Plugin {
	settings: PomodoroSettings;
	private timer: PomodoroTimer;
	private statusBarItem: HTMLElement;
}
```

#### Methods

##### `onload(): Promise<void>`

Plugin initialization method called when the plugin is loaded.

- Loads user settings
- Creates status bar item
- Initializes timer instance
- Registers settings tab

##### `loadSettings(): Promise<void>`

Loads plugin settings from Obsidian's data storage, merging with defaults.

##### `saveSettings(): Promise<void>`

Persists current settings to Obsidian's data storage and updates timer configuration.

##### `resetTimer(): void`

Resets the timer to its initial state for the current timer type.

#### Properties

##### `currentDurationIndex: number` (getter/setter)

Returns the current timer type index (0: work, 1: short break, 2: long break).
Setter provided for settings tab compatibility.

##### `workIntervalCount: number` (getter/setter)

Returns the number of completed work intervals in the current cycle.
Setter provided for settings tab compatibility.

### PomodoroTimer

Core timer logic and status bar interaction handler.

```typescript
class PomodoroTimer {
	constructor(
		plugin: Plugin,
		settings: PomodoroSettings,
		statusBarItem: HTMLElement,
	);
}
```

#### Methods

##### `toggleTimer(): void`

Starts or pauses the timer based on current state.

- **Starting**: Sets end time using Moment.js, registers interval
- **Pausing**: Converts running state to paused Duration
- **Completion**: Handles auto-progress, persistent notifications, or pause
- **Negative time**: Auto-advances timer if time remaining is negative

##### `advanceTimer(): void`

Advances to the next timer type in the cycle and resets duration.

- Increments work interval count for completed work sessions
- Handles transition to long break after required intervals
- Sets new end time for the next timer type

##### `toggleStatusBarVisibility(): void`

Toggles the visibility of the entire status bar timer.

##### `cleanup(): void`

Cleans up all resources when plugin is unloaded.

- Clears all registered intervals
- Removes persistent notifications
- Stops audio playback

##### `resetToWorkState(): void`

Resets timer to work state and clears interval count.

##### `pauseTimer(): void`

Pauses the running timer and updates UI to paused state.

- Clears the countdown interval
- Stores remaining time as Duration
- Updates status bar styling

##### `resetTimer(): void`

Resets timer to full duration for current timer type.

- Stops any running countdown
- Calculates duration based on current timer type and settings
- Updates display to show full time

##### `cycleDuration(): void`

Cycles through timer types (work → short break → long break → work).
Only works when timer is not running.

##### `updateSettings(settings: PomodoroSettings): void`

Updates timer configuration with new settings.

- Refreshes icon visibility
- Resets timer to new durations

#### Properties

##### `currentDuration: number` (getter)

Returns current timer type index (0-2).

##### `workCount: number` (getter)

Returns number of completed work intervals.

##### `running: boolean` (getter)

Returns whether timer is currently counting down.

##### `timeRemaining: number` (getter)

Returns remaining time in seconds.

### PomodoroSettingTab

Settings UI component that extends Obsidian's `PluginSettingTab`.

```typescript
class PomodoroSettingTab extends PluginSettingTab {
	constructor(app: App, plugin: PomodoroPlugin);
}
```

#### Methods

##### `display(): void`

Renders the settings interface with input controls for all configurable options.

## Data Types

### PomodoroSettings

Main configuration interface for the plugin.

```typescript
interface PomodoroSettings {
	workMinutes: number; // Work session duration in minutes
	shortBreakMinutes: number; // Short break duration in minutes
	longBreakMinutes: number; // Long break duration in minutes
	intervalsBeforeLongBreak: number; // Work intervals before long break
	showIcon: boolean; // Display timer icon in status bar
	showInStatusBar: boolean; // Show/hide entire status bar timer
	soundEnabled: boolean; // Enable sound notifications
	persistentNotification: boolean; // Keep notification visible until interaction
	selectedSound: string; // Sound file name for notifications
	soundVolume: number; // Volume for sound notifications (0.0-1.0)
	customSoundUrl?: string; // Optional custom sound URL/file path
	autoProgressEnabled: boolean; // Auto-start next timer in cycle
}
```

### Constants

#### TIMER_STATES

Enumeration of timer types:

```typescript
const TIMER_STATES = {
	WORK: 0,
	SHORT_BREAK: 1,
	LONG_BREAK: 2,
} as const;
```

#### CSS_CLASSES

CSS class names used for styling:

```typescript
const CSS_CLASSES = {
	TIMER: "pomodoro-timer",
	ICON: "pomodoro-icon",
	TEXT: "pomodoro-text",
	ACTIVE: "pomodoro-active",
	PAUSED: "pomodoro-paused",
	NO_ICON: "pomodoro-timer--no-icon",
} as const;
```

#### DEFAULT_SETTINGS

Default configuration values:

```typescript
const DEFAULT_SETTINGS: PomodoroSettings = {
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
```

## Event Handling

### Mouse Events

The status bar timer responds to three mouse events:

#### Left Click (Primary Button)

- **Event**: `click` with `button === 0`
- **Action**: Toggle timer start/pause state
- **Behavior**: Starts timer if stopped, pauses if running

#### Middle Click (Auxiliary Button)

- **Event**: `auxclick` with `button === 1`
- **Action**: Cycle through timer durations
- **Behavior**: Only works when timer is not running

#### Right Click (Context Menu)

- **Event**: `contextmenu`
- **Action**: Reset timer to full duration
- **Behavior**: Only works when timer is paused, prevents default context menu

## Timer State Machine

The timer uses a sophisticated type-based state machine with Moment.js:

### State Representation

```typescript
private timeEnd: moment.Moment | moment.Duration | null = null;
```

- **null** = OFF state (timer reset)
- **Moment** = RUNNING state (counting down to specific UTC timestamp)
- **Duration** = PAUSED state (ready to resume with remaining time)

### State Transitions

```text
OFF (null)
    ↓ (toggleTimer)
RUNNING (Moment) → countdown to timestamp
    ↓ (toggleTimer/pauseTimer)
PAUSED (Duration) → stores remaining time
    ↓ (toggleTimer)
RUNNING (Moment) → resume from saved time
    ↓ (completion/advanceTimer)
NEXT CYCLE → auto-progress or manual advance
```

### Timer Cycle Logic

```text
Work Timer (25min)
    ↓ (completion)
Short Break (5min)
    ↓ (completion, < intervalsBeforeLongBreak)
Work Timer
    ↓ (completion, intervalsBeforeLongBreak reached)
Long Break (15min)
    ↓ (completion)
Work Timer (cycle repeats)
```

## Status Bar Integration

### HTML Structure

```html
<span class="pomodoro-timer">
	<span class="pomodoro-icon">[SVG Icon]</span>
	<span class="pomodoro-text">25:00</span>
</span>
```

### CSS States

- **Default**: No additional classes
- **Active**: `.pomodoro-active` class added during countdown
- **Paused**: `.pomodoro-paused` class added when timer is paused
- **No Icon**: `.pomodoro-timer--no-icon` class when icon is disabled

## Testing Interface

For testing purposes, the plugin exposes private members:

```typescript
// Test-only accessors (prefixed with underscore)
get _statusBarItem(): HTMLElement;
get _timer(): PomodoroTimer;
```

These should only be used in test environments and are not part of the public API.

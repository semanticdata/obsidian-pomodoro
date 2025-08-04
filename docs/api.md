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
        statusBarItem: HTMLElement
    );
}
```

#### Methods

##### `startTimer(): void`

Starts the timer countdown. Sets up interval and updates UI state.

- Changes status bar styling to active state
- Registers interval with Obsidian
- Handles timer completion and state transitions

##### `pauseTimer(): void`

Pauses the running timer and updates UI to paused state.

- Clears the countdown interval
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
    workTime: number;                    // Work session duration in minutes
    shortBreakTime: number;              // Short break duration in minutes  
    longBreakTime: number;               // Long break duration in minutes
    intervalsBeforeLongBreak: number;    // Work intervals before long break
    showIcon: boolean;                   // Display timer icon in status bar
}
```

### Constants

#### TIMER_STATES

Enumeration of timer types:

```typescript
const TIMER_STATES = {
    WORK: 0,
    SHORT_BREAK: 1, 
    LONG_BREAK: 2
} as const;
```

#### CSS_CLASSES

CSS class names used for styling:

```typescript
const CSS_CLASSES = {
    TIMER: 'pomobar-timer',
    ICON: 'pomobar-icon', 
    TEXT: 'pomobar-text',
    ACTIVE: 'is-active',
    PAUSED: 'is-paused',
    NO_ICON: 'no-icon'
} as const;
```

#### DEFAULT_SETTINGS

Default configuration values:

```typescript
const DEFAULT_SETTINGS: PomodoroSettings = {
    workTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    intervalsBeforeLongBreak: 4,
    showIcon: true
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

The timer operates as a state machine with automatic transitions:

```text
Work Timer (25min) 
    ↓ (completion)
Short Break (5min) 
    ↓ (completion, < 4 work intervals)
Work Timer
    ↓ (completion, 4th work interval)
Long Break (15min)
    ↓ (completion)
Work Timer (cycle repeats)
```

## Status Bar Integration

### HTML Structure

```html
<span class="pomobar-timer">
    <span class="pomobar-icon">[SVG Icon]</span>
    <span class="pomobar-text">25:00</span>
</span>
```

### CSS States

- **Default**: No additional classes
- **Active**: `.is-active` class added during countdown
- **Paused**: `.is-paused` class added when timer is paused
- **No Icon**: `.no-icon` class when icon is disabled

## Testing Interface

For testing purposes, the plugin exposes private members:

```typescript
// Test-only accessors (prefixed with underscore)
get _statusBarItem(): HTMLElement;
get _timer(): PomodoroTimer;
```

These should only be used in test environments and are not part of the public API.

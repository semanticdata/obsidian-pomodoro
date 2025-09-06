# Usage Guide

## How It Works

The Pomodoro Technique is a time management method that uses a timer to break down work into intervals, traditionally 25 minutes in length, separated by short breaks. PomoBar automates this process, allowing you to focus on your tasks without constantly checking the clock.

**PomoBar's default cycle:**

1. 🍅 **Work**: 25 minutes of focused work
2. ☕ **Short Break**: 5 minutes of rest
3. 🍅 **Work**: Another 25-minute session
4. ☕ **Short Break**: Another 5-minute rest
5. *Repeat 2 more times...*
6. 🛋️ **Long Break**: 15 minutes of extended rest

After 4 work sessions, you get a longer break to recharge before starting the cycle again.

## Basic Controls

The PomoBar timer appears in your Obsidian status bar and can be controlled with simple mouse interactions or commands.

### Mouse Controls

| Action | Function |
|--------|----------|
| **Left Click** | Start or pause the timer |
| **Middle Click** | Cycle to the next timer phase (work, short break, long break) |
| **Right Click** | Reset the current timer |

### Obsidian Commands

You can also control the timer using Obsidian's command palette. This allows you to assign hotkeys to common actions for a keyboard-driven workflow.

| Command | Description |
|---|---|
| **Toggle Timer** | Plays or pauses the timer. |
| **Reset Timer** | Resets the timer to its initial state. |
| **Cycle Timer** | Switches to the next phase in the Pomodoro cycle. |
| **Toggle Status Bar** | Shows or hides the timer in the status bar. |
| **Toggle Icon** | Shows or hides the timer icon in the status bar. |
| **Toggle Sound Notifications** | Enables or disables audio notifications when timers complete. |

## Timer States

### Work Timer (25 minutes)

- Default state when the plugin loads.
- Used for focused work sessions.
- Automatically transitions to a break after completion.

### Short Break (5 minutes)

- Activated after completing a work session.
- Provides a quick rest period.
- Returns to the work timer after completion.

### Long Break (15 minutes)

- Triggered after completing the configured number of work intervals (default: 4).
- A longer rest period for extended recovery.
- Resets the work interval counter.

## Visual Cues

The timer provides several visual cues to keep you informed of its status at a glance.

### Status Bar Display

- **Inactive**: Shows the timer icon and the remaining time (e.g., "25:00").
- **Running**: The timer counts down with a play icon and active styling.
- **Paused**: Shows a pause icon and the current time with paused styling.

### Icon Display

The timer icon changes to reflect the current state:

| Icon | State |
|---|---|
| **Timer Icon** | Displayed when the timer is inactive. |
| **Play Icon** | Displayed when the timer is running. |
| **Pause Icon** | Displayed when the timer is paused. |

The icon can be toggled on or off in the plugin settings or with the "Toggle Icon" command.

## Workflow Examples

### Standard Workflow (Default)

1. **Start Work Session**: Left-click the timer or use the "Toggle Timer" command to begin a 25-minute work period.
2. **Complete Work**: The timer provides an alert when the time expires and automatically switches to break mode.
3. **Take a Break**: The timer is ready for a 5-minute break (or a 15-minute long break after four work sessions). Click to start the break when ready.
4. **Continue Cycle**: Repeat the process for productive work sessions.

### Auto-Progression Workflow

When auto-progression is enabled in settings:

1. **Start Work Session**: Left-click the timer or use the "Toggle Timer" command to begin a 25-minute work period.
2. **Complete Work**: The timer provides an alert and automatically begins the break period without requiring interaction.
3. **Automatic Breaks**: Break timers start immediately, maintaining the flow of your Pomodoro cycle.
4. **Seamless Transitions**: The cycle continues automatically between work and break periods until you manually pause or reset.

## Notifications

When a timer completes, PomoBar provides both visual and optional audio notifications:

- **Visual Notice**: Shows "PomoBar: Time's up! Your most recent timer has finished."
- **Audio Notification**: Plays an optional sound when enabled in settings

The plugin automatically:

- Switches to the appropriate next timer type.
- Resets the timer to the new duration.
- **Default behavior**: Pauses the timer, so you can start the next session when you are ready.
- **With auto-progression enabled**: Automatically starts the next timer in the cycle for seamless flow.

### Audio Notifications

Sound notifications can be:

- **Enabled/Disabled**: Toggle in settings or using the *Toggle Sound Notifications* command.
- **Customized**: Choose from default options or provide a custom URL/file path.
- **Cross-platform**: Audio loads from CDN for improved reliability and compatibility.

## Tips for Effective Use

- **Focus Mode**: Use work sessions for deep, uninterrupted work.
- **Break Discipline**: Honor break times to maintain productivity.
- **Customize Durations**: Adjust timer lengths in the settings to match your workflow.
- **Use Commands**: Assign hotkeys to timer commands for faster and more efficient control.

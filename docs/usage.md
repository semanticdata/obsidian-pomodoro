# Usage Guide

## Basic Controls

The PomoBar timer appears in your Obsidian status bar and can be controlled with simple mouse interactions:

### Mouse Controls

| Action | Function |
|--------|----------|
| **Left Click** | Start/pause the timer |
| **Middle Click** | Cycle between durations (25/15/5 minutes) |
| **Right Click** | Reset timer (only when paused) |

## Timer States

### Work Timer (25 minutes)

- Default state when plugin loads
- Used for focused work sessions
- Automatically transitions to break after completion

### Short Break (5 minutes)

- Activated after completing a work session
- Provides a quick rest period
- Returns to work timer after completion

### Long Break (15 minutes)

- Triggered after completing the configured number of work intervals (default: 4)
- Longer rest period for extended recovery
- Resets work interval counter

## Visual Indicators

### Status Bar Display

- **Inactive**: Shows remaining time (e.g., "25:00")
- **Running**: Timer counts down with active styling
- **Paused**: Shows current time with paused styling

### Icon Display

- Timer icon appears next to the countdown (can be toggled in settings)
- Icon visibility can be controlled in plugin settings

## Workflow Example

1. **Start Work Session**: Left-click the timer to begin a 25-minute work period
2. **Complete Work**: Timer alerts when time expires and automatically switches to break mode
3. **Take Break**: Timer is ready for a 5-minute break (or 15-minute long break after 4 work sessions)
4. **Continue Cycle**: Repeat the process for productive work sessions

## Notifications

When a timer completes, PomoBar shows a browser alert: "PomoBar: Time's up! Your most recent timer has finished."

The plugin automatically:

- Switches to the appropriate next timer type
- Resets the timer to the new duration
- Pauses the timer (you need to manually start the next session)

## Tips for Effective Use

- **Focus Mode**: Use work sessions for deep, uninterrupted work
- **Break Discipline**: Honor break times to maintain productivity
- **Customize Durations**: Adjust timer lengths in settings to match your workflow
- **Middle Click**: Quickly switch between timer types when needed

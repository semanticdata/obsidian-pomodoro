# Configuration

## Accessing Settings

1. Open Obsidian Settings (Ctrl/Cmd + ,)
2. Navigate to "Community Plugins" in the left sidebar
3. Find "PomoBar" in the installed plugins list
4. Click the gear icon or "Options" button

## Available Settings

### Work Duration

- **Description**: Duration of work timer sessions in minutes
- **Default**: 25 minutes
- **Range**: Any positive integer
- **Example**: Set to 30 for longer work sessions

### Short Break Duration

- **Description**: Duration of short break periods in minutes
- **Default**: 5 minutes
- **Range**: Any positive integer
- **Example**: Set to 10 for longer quick breaks

### Long Break Duration

- **Description**: Duration of long break periods in minutes
- **Default**: 15 minutes
- **Range**: Any positive integer
- **Example**: Set to 30 for extended breaks

### Intervals Before Long Break

- **Description**: Number of work sessions before triggering a long break
- **Default**: 4 intervals
- **Range**: Any positive integer
- **Behavior**: After this many work sessions, the next break will be a long break

### Show Timer Icon

- **Description**: Controls visibility of the timer icon in the status bar
- **Default**: Enabled (true)
- **Options**: Toggle on/off
- **Effect**: Shows/hides the timer icon next to the countdown

## Configuration Examples

### Traditional Pomodoro Technique

```text
Work Duration: 25 minutes
Short Break Duration: 5 minutes
Long Break Duration: 15 minutes
Intervals Before Long Break: 4
```

### Extended Work Sessions

```text
Work Duration: 45 minutes
Short Break Duration: 10 minutes
Long Break Duration: 30 minutes
Intervals Before Long Break: 3
```

### Quick Sprints

```text
Work Duration: 15 minutes
Short Break Duration: 3 minutes
Long Break Duration: 15 minutes
Intervals Before Long Break: 6
```

## Settings Behavior

### Automatic Updates

- Changes take effect immediately after saving
- The current timer resets to the new duration
- Work interval counter resets when changing the intervals setting

### Validation

- Only positive integer values are accepted
- Invalid entries are ignored
- Settings revert to previous valid values if invalid input is provided

## Troubleshooting Settings

### Settings Not Saving

- Ensure you're entering valid positive integers
- Try reloading Obsidian if settings appear stuck
- Check that the plugin is properly enabled

### Timer Not Reflecting Changes

- Settings automatically reset the current timer
- If changes don't appear, try manually resetting with right-click
- Restart the plugin if issues persist

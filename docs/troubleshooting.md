# Troubleshooting Guide

This guide provides solutions to common issues with the PomoBar plugin. If you don't find an answer here, please report the issue.

## Common Problems

### Timer Not Appearing

- **Symptom**: The timer is not visible in the status bar.
- **Solution**:
  1. **Enable the Plugin**: Go to `Settings > Community Plugins` and make sure "PomoBar" is toggled on.
  2. **Check Settings**: In PomoBar's settings, ensure "Show Timer Icon" is enabled.
  3. **Restart Obsidian**: Sometimes a simple restart resolves visibility issues.

### Timer Not Responding

- **Symptom**: Clicking the timer (left, middle, or right) has no effect.
- **Solution**:
  1. **Check for Conflicts**: Disable other plugins one by one to see if another plugin is interfering with PomoBar.
  2. **Re-enable Plugin**: Disable and then re-enable PomoBar in the Community Plugins settings.
  3. **Check Console**: Open the developer console (`Ctrl+Shift+I` or `Cmd+Option+I`) and look for error messages related to PomoBar.

### Settings Not Saving

- **Symptom**: Changes to timer durations or other settings are not applied.
- **Solution**:
  1. **Enter Valid Numbers**: Ensure you are entering positive integers for all timer durations.
  2. **Reload Obsidian**: After changing settings, reload Obsidian to ensure they are correctly applied.
  3. **Check File Permissions**: Make sure Obsidian has permission to write to its configuration files.

### Incorrect Time Display

- **Symptom**: The timer shows the wrong time or doesn't update.
- **Solution**:
  1. **Reset the Timer**: Right-click the timer to reset it to its default state.
  2. **Check System Clock**: Ensure your computer's clock is accurate.

## Performance Issues

### High CPU Usage

- **Symptom**: Obsidian becomes slow or unresponsive when the timer is running.
- **Solution**:
  1. **Disable and Re-enable**: Try turning the plugin off and on again.
  2. **Report the Issue**: If the problem persists, open an issue on GitHub with details about your setup.

### Memory Leaks

- **Symptom**: Obsidian's memory usage grows over time when PomoBar is active.
- **Solution**: This is a serious issue. Please report it on GitHub immediately, including as much detail as possible.

## Advanced Troubleshooting

### Enabling Debug Mode

- **How to Enable**: (Instructions on enabling debug mode, if available)
- **What to Look For**: (Details on what information to gather in debug mode)

### Data Recovery

- **Problem**: Your settings were reset or lost.
- **Solution**: PomoBar stores its settings in Obsidian's data files. You may be able to recover them from a backup if you have one.

## Reporting Bugs

If you've tried these steps and are still having trouble, please open an issue on our [GitHub repository](https://github.com/semanticdata/obsidian-pomodoro/issues).

When reporting a bug, please include:

- A clear description of the problem.
- Steps to reproduce the issue.
- Any error messages from the developer console.
- Your Obsidian version and PomoBar plugin version.

# Troubleshooting

## Common Issues

### Timer Not Appearing in Status Bar

**Symptoms**: Plugin is enabled but no timer is visible in the status bar.

**Solutions**:

1. **Check Plugin Status**:
   - Go to Settings → Community Plugins
   - Verify "PomoBar" is enabled (toggle should be blue/on)
   - Try disabling and re-enabling the plugin

2. **Reload Obsidian**:
   - Press `Ctrl/Cmd + R` to reload Obsidian
   - Or restart the application completely

3. **Verify Installation**:
   - Check that all plugin files exist in `.obsidian/plugins/pomobar/`
   - Required files: `main.js`, `manifest.json`, `styles.css`

### Timer Not Responding to Clicks

**Symptoms**: Timer is visible but clicks don't start/stop/reset the timer.

**Solutions**:

1. **Check for Conflicting Plugins**:
   - Disable other status bar plugins temporarily
   - Test if the issue persists

2. **Clear Plugin Data**:
   - Go to Settings → Community Plugins → PomoBar → Reset to Defaults
   - Or manually delete `.obsidian/plugins/pomobar/data.json`

3. **Browser Console Errors**:
   - Open Developer Tools (F12)
   - Check Console tab for JavaScript errors
   - Report errors to the plugin repository

### Settings Not Saving

**Symptoms**: Changes in settings don't persist or take effect.

**Solutions**:

1. **Validate Input Values**:
   - Ensure all duration fields contain positive integers
   - Invalid values are automatically rejected

2. **File Permissions**:
   - Check that Obsidian can write to the vault directory
   - Verify `.obsidian/plugins/pomobar/data.json` is writable

3. **Settings Reset**:
   - Try resetting settings to defaults
   - Manually edit `data.json` if necessary

### Timer Shows Incorrect Time

**Symptoms**: Timer displays wrong duration or doesn't count down properly.

**Solutions**:

1. **Reset Timer**:
   - Right-click the timer when paused to reset
   - Or change settings to force a reset

2. **Check Settings**:
   - Verify duration settings are configured correctly
   - Ensure values are in minutes, not seconds

3. **Plugin Restart**:
   - Disable and re-enable the plugin
   - This reinitializes the timer state

## Plugin Performance Issues

### High CPU Usage

**Symptoms**: Obsidian becomes slow or unresponsive when timer is running.

**Solutions**:

1. **Update Plugin**:
   - Ensure you're using the latest version
   - Check for updates in Community Plugins

2. **Other Plugin Conflicts**:
   - Disable other plugins to isolate the issue
   - Re-enable one by one to identify conflicts

### Memory Leaks

**Symptoms**: Obsidian memory usage increases over time.

**Solutions**:

1. **Restart Obsidian Regularly**:
   - Close and reopen Obsidian periodically
   - This clears any accumulated memory issues

2. **Report the Issue**:
   - If memory usage consistently grows, report to developers
   - Include system information and reproduction steps

## Installation Problems

### Manual Installation Fails

**Symptoms**: Plugin doesn't appear after manual installation.

**Solutions**:

1. **Verify File Locations**:

   ```text
   .obsidian/plugins/pomobar/
   ├── main.js
   ├── manifest.json
   └── styles.css
   ```

2. **Check File Integrity**:
   - Re-download files from the latest release
   - Verify files aren't corrupted or empty

3. **Folder Permissions**:
   - Ensure `.obsidian/plugins/` directory exists
   - Check that you have write permissions

### Community Plugin Installation Fails

**Symptoms**: Plugin doesn't install from Community Plugins browser.

**Solutions**:

1. **Check Internet Connection**:
   - Verify you can access other community plugins
   - Try refreshing the plugin list

2. **Safe Mode**:
   - Ensure Safe Mode is disabled
   - Go to Settings → Community Plugins → Turn off Safe Mode

3. **Clear Plugin Cache**:
   - Close Obsidian
   - Delete `.obsidian/plugins/.gitignore` if it exists
   - Restart Obsidian and try again

## Advanced Troubleshooting

### Debug Mode

Enable debug logging by:

1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for PomoBar-related messages
4. Note any error messages or warnings

### Plugin Conflicts

Common conflicts occur with:

- Other status bar plugins
- Timer/productivity plugins
- Theme plugins that modify status bar styling

To isolate conflicts:

1. Disable all other plugins
2. Test PomoBar functionality
3. Re-enable plugins one by one
4. Identify which plugin causes the conflict

### Data Recovery

If settings are lost:

1. Check `.obsidian/plugins/pomobar/data.json`
2. Restore from backup if available
3. Manually recreate settings if necessary

Example `data.json` structure:

```json
{
    "workTime": 25,
    "shortBreakTime": 5,
    "longBreakTime": 15,
    "intervalsBeforeLongBreak": 4,
    "showIcon": true
}
```

## Getting Help

### Before Reporting Issues

1. **Update Everything**:
   - Update Obsidian to the latest version
   - Update PomoBar to the latest version
   - Update your operating system

2. **Gather Information**:
   - Obsidian version
   - PomoBar version
   - Operating system
   - List of other enabled plugins
   - Steps to reproduce the issue

3. **Try Safe Mode**:
   - Test in a clean vault with only PomoBar enabled
   - This helps isolate plugin-specific issues

### Reporting Bugs

Create an issue at the [GitHub repository](https://github.com/semanticdata/obsidian-pomodoro/issues) with:

- **Clear description** of the problem
- **Steps to reproduce** the issue
- **Expected behavior** vs. actual behavior
- **System information** (OS, Obsidian version, plugin version)
- **Console errors** if any (from Developer Tools)
- **Screenshots** if relevant

### Community Support

- Check existing issues on GitHub first
- Search the Obsidian community forums
- Ask questions in the Obsidian Discord server

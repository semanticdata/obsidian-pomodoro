# 🌟 PomoBar

A minimalist Pomodoro timer that lives in your [Obsidian](https://obsidian.md) status bar. Focus on your work while keeping track of time with this unobtrusive timer.

| Description  |             Screenshots             |
| ------------ | :---------------------------------: |
| Default View | ![screenshot-1](./screenshot-1.png) |
| Running      | ![screenshot-2](./screenshot-2.png) |

While learning to make Obsidian plugins, I thought it would be a good idea to make a Pomodoro timer that lives in the status bar. I use one all the time!

## ✨ Features

- Clean and simple status bar timer
- Default 25-minute Pomodoro sessions with 15 and 5-minute break options
- Easy controls:
  - Left click to start/stop the timer
  - Middle click to cycle between 25/15/5 minute durations
  - Right click to reset
- Minimal interface that doesn't get in your way

## 📦 Installation

1. Open Obsidian Settings
2. Navigate to Community Plugins and disable Safe Mode
3. Click Browse and search for "PomoBar"
4. Install the plugin
5. Enable the plugin in your Community Plugins list

## 🛠️ Usage

1. Look for the timer in your status bar (shows as "25:00" when not started)
2. Left click to start the timer
3. Left click again to pause the timer
4. Middle click to cycle between different durations (25/15/5 minutes)
5. When paused, right click to reset to the current duration
6. Timer will automatically stop when it reaches 00:00

### 📁 Manual Installation

1. Create a new folder `pomobar` in your vault's `.obsidian/plugins` folder
2. Copy `main.js`, `manifest.json`, and `styles.css` to the new folder
3. Reload Obsidian to load the plugin

## Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: <https://github.com/obsidianmd/obsidian-sample-plugin/releases>
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

## 📜 License

The code in this repository is available under the [MIT License](LICENSE).

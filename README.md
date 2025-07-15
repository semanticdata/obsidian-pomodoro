# 🌟 PomoBar

A minimalist Pomodoro timer that lives in your [Obsidian](https://obsidian.md) status bar. Focus on your work while keeping track of time with this unobtrusive timer.

| Description            | Screenshots                                              |
| ---------------------- | :------------------------------------------------------: |
| Default View           | ![screenshot-1](./screenshots/screenshot-1.png)           |
| Running                | ![screenshot-2](./screenshots/screenshot-2.png)           |
| Default (w /Icons)     | ![screenshot-icon-1](./screenshots/screenshot-icon-1.png) |
| Running (w /Icons)     | ![screenshot-icon-2](./screenshots/screenshot-icon-2.png) |

## Features

- **Simple Status Bar Timer**: Clean, minimal interface that stays out of your way
- **Flexible Durations**: 25-minute work sessions with 5 and 15-minute break options
- **Easy Controls**:
  - Left click: Start/stop timer
  - Middle click: Cycle between durations (25/15/5 minutes)
  - Right click: Reset timer (when paused)
- **Automatic Cycling**: Seamlessly transitions between work and break periods
- **Configurable Settings**: Customize timer durations and intervals

## Installation

### From Obsidian Community Plugins

1. Open Obsidian Settings → Community Plugins
2. Disable Safe Mode if enabled
3. Browse and search for "PomoBar"
4. Install and enable the plugin

### Manual Installation

1. Download the latest release files (`main.js`, `manifest.json`, `styles.css`)
2. Create folder `.obsidian/plugins/pomobar/` in your vault
3. Copy the files to this folder
4. Reload Obsidian and enable the plugin

## Usage

The timer appears in your status bar showing "25:00" when inactive.

- **Start/Pause**: Left click the timer
- **Change Duration**: Middle click to cycle between 25/15/5 minutes
- **Reset**: Right click when timer is paused
- **Settings**: Configure durations in Plugin Settings

## Contributing

Interested in contributing? See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, testing, and contribution guidelines.

## License

The code in this repository is available under the [MIT License](LICENSE).

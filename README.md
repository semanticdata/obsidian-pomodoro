# Status Bar Pomodoro for Obsidian

A minimalist Pomodoro timer that lives in your Obsidian status bar. Focus on your work while keeping track of time with this unobtrusive timer. While learning to make Obsidian plugins, I thought it would be a good idea to make a Pomodoro timer that lives in the status bar. I use one all the time!

## Features

-   Clean and simple status bar timer
-   Default 25-minute Pomodoro sessions
-   Easy controls:
    -   Left click to start/stop the timer
    -   Right click to reset
-   Minimal interface that doesn't get in your way

## Installation (_NOT AVAILABLE IN THE COMMUNITY PLUGINS YET!_)

1. Open Obsidian Settings
2. Navigate to Community Plugins (_NOT AVAILABLE YET!_) and disable Safe Mode
3. Click Browse and search for "Status Bar Pomodoro"
4. Install the plugin
5. Enable the plugin in your Community Plugins list

## Usage

1. Look for the timer in your status bar (shows as "25:00" when not started)
2. Left click to start the timer
3. Left click again to pause
4. When paused, right click to reset to 25:00
5. Timer will automatically stop when it reaches 00:00

## Development

This plugin is built using the Obsidian Plugin API.

### Building

1. Clone this repository
2. Run `npm install`
3. Run `npm run dev` to start compilation in watch mode
4. Run `npm run build` to build the plugin

### Manual Installation

1. Create a new folder `status-bar-pomodoro` in your vault's `.obsidian/plugins` folder
2. Copy `main.js`, `manifest.json`, and `styles.css` to the new folder
3. Reload Obsidian to load the plugin

## License

The code in this repository is available under the [MIT License](LICENSE).

# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - Unreleased

### Changed

- Briefly tried switching from using esbuild to Vite, then reverted the build system from Vite back to esbuild. While Vite was explored for its development features, esbuild proved to be a more stable and performant choice for an Obsidian plugin.
- Refactored the codebase for better organization and maintainability.
- Improved timer state management for more reliable operation.
- Standardized CSS class names for consistency.
- Extracted repetitive input validation logic into reusable helper functions.
- Refactored timer methods to eliminate code duplication in interval management.

### Added

- New opt-in status bar icon for the plugin.
- Documentation site built with MkDocs.
- CHANGELOG with all plugin release notes.
- Increased test coverage for the plugin lifecycle, timer logic, and settings.
  - Robust input validation tests for the settings tab.
  - Edge case testing for the timer and other components.

### Fixed

- Timer inconsistencies when cycling through durations.
- A memory leak that occurred when the plugin was unloaded.
- A bug that allowed settings to be changed in an unsafe way.
- Replaced browser alerts with Obsidian's native `Notice` API.
- Improved DOM event listener management to prevent memory leaks on plugin reload.
- Replaced magic numbers with named constants for MouseEvent.button values.
- Renamed `resetTimerState` to `resetPomodoroSession` for better clarity.
- Minor bugs related to type errors, event handling, and input validation.

## [1.1.0] - 2025-06-11

### Added

- Settings panel to configure:
  - Work, short break, and long break durations.
  - Number of work sessions before a long break.
  - Status bar icon visibility.
- Initial test suite using Jest.
- `pnpm` and `ESLint` to the development workflow.
- README and CHANGELOG files.

## [1.0.0] - 2025-01-30

### Added

- Initial release.
- Core Pomodoro timer with work, short break, and long break states.
- Visual countdown (MM:SS) in the status bar.
- Audio alerts on timer completion.
- Mouse controls for the timer:
  - Left-click: Start/pause timer.
  - Middle-click: Cycle modes.
  - Right-click: Reset timer.
- Color changes in UI to indicate timer state.

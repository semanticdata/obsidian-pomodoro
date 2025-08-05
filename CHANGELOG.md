# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - Unreleased

### Changed

- Briefly tried switching from using esbuild to Vite, then reverted the build system from Vite back to esbuild. While Vite was explored for its development features, esbuild proved to be a more stable and performant choice for an Obsidian plugin.
- Overhauled the entire codebase for better organization and maintainability.
- Improved the timer's internal state management for more reliable operation.

### Added

- Introduced a new icon system with improved visuals.
- Expanded the test suite, increasing overall coverage.
- Added comprehensive tests for the plugin lifecycle, timer logic, and settings.
- Implemented watch mode with hot reloading to improve the development workflow.
- New Documentation based on MkDocs with Material theme

### Fixed

- Resolved a critical bug that caused timer inconsistencies when cycling through durations.
- Fixed a memory leak by ensuring timers are properly cleaned up when the plugin is unloaded.
- Prevented a bug where settings could be changed in an unsafe way, bypassing timer logic.
- Replaced disruptive browser alerts with Obsidian's native `Notice` API for a smoother user experience.
- Corrected multiple minor bugs related to type errors, event handling, and input validation.
- Standardized all CSS class names for consistency.

## [1.1.0] - 2025-06-11

### Added

- A comprehensive settings panel to customize timer durations and behavior.
- Options to configure work, short break, and long break durations.
- A setting to control how many work sessions trigger a long break.
- A toggle to show or hide the timer icon in the status bar.
- An initial test suite using the Jest framework.
- `pnpm` for package management and `ESLint` for code linting.
- Basic documentation, including a README and this CHANGELOG.

## [1.0.0] - 2025-01-30

### Added

- **Initial Release**
- Core Pomodoro timer with work, short break, and long break states.
- Visual countdown (MM:SS) in the Obsidian status bar.
- Audio alerts upon timer completion.
- Mouse controls:
    - **Left-click:** Start/pause the timer.
    - **Middle-click:** Cycle between work and break modes.
    - **Right-click:** Reset the timer.
- Visual feedback with color changes for different timer states.
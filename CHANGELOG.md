# Changelog

All notable changes to this project will be documented in this file.

## 1.6.0 - 2025-12-27

### Added

- New persistent notification feature that maintains timer state across plugin reloads.
- Settings migration logic to handle future feature updates seamlessly.

### Changed

- Major timer refactoring for more reliable state management:
  - Moved from manual timing to epoch-based timing for improved accuracy.
  - Pause state now managed by storing remaining duration.
  - Running state inferred from timer interval being set.
  - Start/Pause consolidated into single `toggleTimer` method.
- Improved variable naming throughout the codebase for better readability.
- Enhanced audio notification persistence to work reliably with the new timer system.

### Fixed

- Fixed negative time formatting display issues.
- Resolved timer consistency issues during state transitions.
- Fixed test suite after major refactoring:
  - Replaced manual time calculations with moment.js integration.
  - Fixed circular reference errors in test mocks.
  - Centralized mock definitions for better maintainability.
  - Improved fake timer integration with moment.js.
- Corrected TypeScript errors and assertion failures in tests.
- Fixed overflow display of negative numbers in timer countdown.

### Developer Experience

- Comprehensive test refactoring and improvements.
- Added proper test cleanup and mock management.
- Updated documentation to reflect new timer architecture.
- Code formatting with Prettier across the entire codebase.
- Resolved lint issues and improved code quality.

## 1.5.0 - 2025-09-08

### Added

- New optional auto progression feature to automatically start the next timer in your cycle.

## 1.4.0 - 2025-08-26

### Changed

- Simplified audio loading logic by removing complex local file path resolution.
- Updated all dependencies to latest versions.
- Replaced Settings Headings with proper `setHeading()` method for Obsidian plugin guidelines compliance.

### Fixed

- Updated test mocks to support new `setHeading()` method.
- Corrected test expectations and setting indices after settings UI restructure.
- Fixed lint errors in sound manager.

### Added

- New optional notification sound at the end of the timer.
  - Audio notifications load from CDN for improved reliability and cross-platform compatibility.
  - Option to use Custom URL or File instead of the default options.
- New Obsidian command to toggle Sound Notifications on and off.

## 1.3.0 - 2025-08-17

### Changed

- Adjusted colors to more closely match other status bar elements.
- Moved from inline SVG icons to separate files.

### Added

- New Obsidian commands:
  - Toggle status bar visibility.
  - Toggle icon visibility.
  - Toggle the timer (play/pause).
  - Reset timer.
  - Cycle timer to next phase.
- New dependency to handle SVG icons `esbuild-plugin-svg`.
- New icon logic:
  - New Paused icon used when the timer is paused.
  - New Play icon used when the timer is running.
  - Timer icon used when inactive.
- Comprehensive test coverage improvements:
  - Added command integration tests for all new keyboard shortcuts.
  - Added icon state transition tests for new icon switching logic.
  - Added timer completion flow tests for work/break transitions.

### Fixed

- Resolved test hanging issues caused by mock timer implementation using real `setTimeout`.
- Added proper test cleanup in `afterEach` hooks to prevent timer leaks.
- Fixed mock interval implementation to avoid creating real timers during testing.

## 1.2.0 - 2025-08-08

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

## 1.1.0 - 2025-06-11

### Added

- Settings panel to configure:
  - Work, short break, and long break durations.
  - Number of work sessions before a long break.
  - Status bar icon visibility.
- Initial test suite using Jest.
- `pnpm` and `ESLint` to the development workflow.
- README and CHANGELOG files.

## 1.0.0 - 2025-01-30

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

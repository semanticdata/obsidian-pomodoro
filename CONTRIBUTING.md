# Contributing to PomoBar

Thank you for your interest in contributing to PomoBar! This document provides guidelines and information for developers who want to contribute to the project.

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or later)
- [pnpm](https://pnpm.io/) package manager
- [Obsidian](https://obsidian.md) for testing

### Getting Started

1. Fork and clone the repository:

   ```bash
   git clone https://github.com/your-username/obsidian-pomodoro.git
   cd obsidian-pomodoro
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start development build with file watching:

   ```bash
   pnpm dev
   ```

4. Link the plugin to your Obsidian vault for testing:
   - Copy or symlink the project folder to `.obsidian/plugins/` in your test vault
   - Reload Obsidian and enable the plugin

## Development Commands

```bash
# Development build with file watching
pnpm dev

# Production build with type checking
pnpm build

# Linting
pnpm lint
pnpm lint:fix

# Testing
pnpm test
pnpm test:watch
pnpm test:coverage

# Version management
pnpm version
```

## Architecture Overview

PomoBar is built as a single-file Obsidian plugin with the following key components:

### Core Architecture

- **Single Plugin Class**: `PomodoroPlugin` in `main.ts` contains all timer logic and UI management
- **Settings Interface**: `PomodoroSettings` defines configurable timer durations
- **Settings Tab**: `PomodoroSettingTab` provides user configuration interface
- **Status Bar Integration**: Timer display and controls live in Obsidian's status bar

### Timer State Management

- **Timer States**: Uses `isRunning` boolean and `remainingTime` counter
- **Duration Cycling**: `currentDurationIndex` tracks work/break states (0=work, 1=short break, 2=long break)
- **Interval Management**: Tracks work intervals with `workIntervalCount` for automatic long break transitions
- **Browser Intervals**: Uses `window.setInterval` with Obsidian's `registerInterval` for cleanup

### User Interactions

- **Left Click**: Start/pause timer
- **Middle Click**: Cycle between durations (25/15/5 minutes)
- **Right Click**: Reset timer (only when paused)

## Testing

The project uses Jest with comprehensive test coverage:

```bash
# Run tests
pnpm test

# Run with coverage report
pnpm test:coverage

# Watch mode for development
pnpm test:watch
```

### Test Coverage

- 40+ tests covering timer functionality, settings management, UI interactions, and edge cases
- 80%+ code coverage
- Timer testing uses fake timers for time-based functionality
- Mocked Obsidian API located in `tests/__mocks__/obsidian.ts`

## Code Style

The project follows strict linting rules:

```bash
# Check code style
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix
```

### Key Guidelines

- TypeScript with strict type checking
- ESLint configuration for consistent code style
- Uses `@ts-ignore` comments sparingly for Obsidian API limitations
- Follows Obsidian plugin conventions

## Build System

- **esbuild**: Bundles TypeScript to CommonJS for Obsidian compatibility
- **Target**: ES2018 with external Obsidian API dependencies
- **Development**: Watch mode with inline source maps
- **Production**: Minified output without source maps

## File Structure

```text
obsidian-pomodoro/
├── src/
│   ├── components/
│   │   └── SettingsTab.ts    # Settings UI component
│   ├── logic/
│   │   └── timer.ts          # Timer logic implementation
│   ├── constants.ts          # Plugin constants
│   ├── icons.ts              # Icon definitions
│   ├── main.ts               # Core plugin implementation
│   └── types.ts              # TypeScript type definitions
├── tests/
│   ├── __mocks__/
│   │   └── obsidian.ts       # Obsidian API mocks for testing
│   ├── plugin.test.ts        # Main plugin tests
│   ├── settings-tab.test.ts  # Settings tab tests
│   ├── settings.test.ts      # Settings logic tests
│   ├── setup.ts              # Test setup configuration
│   └── timer.test.ts         # Timer logic tests
├── public/
│   └── styles.css            # Status bar timer styling
├── coverage/                 # Test coverage reports
├── dist/                     # Built plugin files
├── manifest.json             # Plugin metadata and version info
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── jest.config.mjs           # Jest testing configuration
├── vite.config.ts            # Vite build configuration
├── eslint.config.mjs         # ESLint configuration
├── version-bump.mjs          # Version management script
├── versions.json             # Version history
├── CHANGELOG.md              # Change log
├── LICENSE                   # License information
└── README.md                 # Project documentation
```

## Submitting Changes

1. **Create a feature branch**: `git checkout -b feature/your-feature-name`
2. **Make your changes**: Follow the coding guidelines above
3. **Test your changes**: Run `pnpm test` and `pnpm lint`
4. **Build the plugin**: Run `pnpm build` to ensure it compiles
5. **Commit your changes**: Use clear, descriptive commit messages
6. **Push and create a pull request**: Describe what your changes do and why

## Pull Request Guidelines

- Ensure all tests pass (`pnpm test`)
- Ensure linting passes (`pnpm lint`)
- Ensure the plugin builds successfully (`pnpm build`)
- Include tests for new functionality
- Update documentation if needed
- Keep changes focused and atomic

## Getting Help

- Check existing [issues](https://github.com/your-username/obsidian-pomodoro/issues) for similar problems
- Create a new issue for bugs or feature requests
- Join discussions in the issue tracker

## Development Tips

- Use `pnpm dev` during development for automatic rebuilds
- Test with different Obsidian themes and settings
- The plugin is desktop-only (`isDesktopOnly: true` in manifest)
- Timer state is managed through CSS classes (`active`, `paused`)
- Settings are persisted using Obsidian's plugin data storage

Thank you for contributing to PomoBar!

# Development Guide

## Getting Started

### Prerequisites

- Node.js (version 20 or higher)
- pnpm package manager
- Git

### Setup Development Environment

1. **Clone the repository**:

```bash
git clone https://github.com/semanticdata/obsidian-pomodoro.git
cd obsidian-pomodoro
```

1. **Install dependencies**:

=== "PNPM"

    ```bash
    pnpm install
    ```

=== "NPM"

    ```bash
    npm install
    ```

1. **Start development mode**:

=== "PNPM"

    ```bash
    pnpm run dev
    ```

=== "NPM"

    ```bash
    npm run dev
    ```

## Project Structure

- `CONTRIBUTING.md`: Guidelines for contributing to the project.
- `CHANGELOG.md`: A log of changes made to the project.
- `README.md`: The main README file for the project.
- `package.json`: Defines the project's dependencies and scripts.
- `pyproject.toml`: Configuration file for Python projects.
- `docs/`: Contains the documentation files for the project.
  - `api.md`: Documentation for the project's API.
  - `configuration.md`: Documentation for the project's configuration.
  - `development.md`: Documentation for developers.
  - `index.md`: The main documentation file.
  - `installation.md`: Documentation for installing the project.
  - `troubleshooting.md`: Documentation for troubleshooting the project.
  - `usage.md`: Documentation for using the project.
- `src/`: Contains the source code for the project.
  - `components/`: Contains the project's components.
    - `SettingsTab.ts`: The settings tab component.
  - `constants.ts`: Contains the project's constants.
  - `icons.ts`: Contains the project's icons.
  - `logic/`: Contains the project's logic.
    - `timer.ts`: The timer logic with Moment.js state machine.
    - `soundManager.ts`: Audio notification management.
  - `main.ts`: The main entry point for the project.
  - `types.ts`: Contains the project's types.
- `tests/`: Contains the tests for the project.
  - `__mocks__/`: Contains mocks for the tests.
    - `obsidian.ts`: Mocks for the Obsidian API.
    - `svg-mock.ts`: Mock for SVG icon imports.
  - `helpers/`: Reusable test helper functions.
    - `plugin-test-helpers.ts`: Standardized plugin setup and cleanup helpers.
    - `settings-test-helpers.ts`: Mock component helpers and validation test utilities.
  - `plugin/`: Plugin-level tests organized by functionality.
    - `commands.test.ts`: Tests for plugin commands.
    - `compatibility.test.ts`: Tests for backward compatibility features.
    - `lifecycle.test.ts`: Tests for plugin lifecycle events.
  - `settings/`: Settings-related tests.
    - `display.test.ts`: Tests for settings display and rendering.
    - `validation.test.ts`: Tests for settings input validation.
  - `timer/`: Timer logic tests organized by feature area.
    - `auto-progression.test.ts`: Tests for auto-progress functionality.
    - `basic-operations.test.ts`: Tests for core timer operations.
    - `edge-cases.test.ts`: Tests for edge cases and error handling.
    - `mouse-events.test.ts`: Tests for mouse interaction handling.
    - `timer-completion.test.ts`: Tests for timer completion behavior.
  - `setup.ts`: Jest test setup and global configuration.

## Available Scripts

| Command                  | Description                                  |
| ------------------------ | -------------------------------------------- |
| `pnpm run dev`           | Build in development mode with file watching |
| `pnpm run build`         | Build for production                         |
| `pnpm run lint`          | Run ESLint code analysis                     |
| `pnpm run lint:fix`      | Fix automatically fixable linting issues     |
| `pnpm run test`          | Run Jest test suite                          |
| `pnpm run test:watch`    | Run tests in watch mode                      |
| `pnpm run test:coverage` | Generate test coverage report                |

## Architecture Overview

### Core Classes

#### PomodoroPlugin (`src/main.ts`)

- Main plugin entry point
- Manages plugin lifecycle and settings
- Coordinates between timer and settings components

#### PomodoroTimer (`src/logic/timer.ts`)

- Handles all timer logic and state management using Moment.js
- Manages status bar display and user interactions
- Controls timer intervals and state transitions with type-based state machine
- Integrates with SoundManager for audio notifications
- Supports persistent notifications and auto-progress functionality

#### PomodoroSettingTab (`src/components/SettingsTab.ts`)

- Provides settings UI within Obsidian preferences
- Handles user input validation and settings persistence

### Key Interfaces

#### PomodoroSettings (`src/types.ts`)

```typescript
interface PomodoroSettings {
 workMinutes: number; // Work session duration (minutes)
 shortBreakMinutes: number; // Short break duration (minutes)
 longBreakMinutes: number; // Long break duration (minutes)
 intervalsBeforeLongBreak: number; // Work sessions before long break
 showIcon: boolean; // Show/hide timer icon
 showInStatusBar: boolean; // Show/hide entire status bar timer
 soundEnabled: boolean; // Enable sound notifications
 persistentNotification: boolean; // Keep notifications visible until interaction
 selectedSound: string; // Sound file name
 soundVolume: number; // Volume level (0.0-1.0)
 customSoundUrl?: string; // Optional custom sound URL
 autoProgressEnabled: boolean; // Auto-start next timer
}
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Generate coverage report
pnpm run test:coverage
```

### Test Structure

The test suite is organized into focused modules to improve maintainability:

- **Unit Tests**: Test individual components and functions in isolation
- **Integration Tests**: Test component interactions and workflows
- **Mock Objects**: Obsidian API is mocked for testing in `tests/__mocks__/`

#### Test Organization Pattern

Tests are organized by feature rather than component:

- `tests/plugin/` - Plugin-level functionality (commands, lifecycle, compatibility)
- `tests/timer/` - Timer-specific features (basic operations, mouse events, auto-progression, edge cases)
- `tests/settings/` - Settings UI and validation (display, validation logic)

#### Test Helpers

Reusable test helpers eliminate duplication:

- `createStandardTestPlugin()` - Creates a fully initialized plugin with default settings
- `cleanupStandardTestPlugin(plugin)` - Cleans up timers and resources after tests
- `createTestPluginWithSavedData(savedData)` - Creates a plugin with custom settings
- `createMockTextComponent()` / `createMockToggleComponent()` - Mock Obsidian UI components
- `testNumericValidation()` - Reusable validation test helper for numeric settings

### Writing Tests

```typescript title="tests/timer/basic-operations.test.ts"
import "../setup";
import PomodoroPlugin from "../../src/main";
import { PluginWithPrivates } from "../setup";
import { createStandardTestPlugin, cleanupStandardTestPlugin } from "../helpers/plugin-test-helpers";

describe("PomodoroTimer - Basic Operations", () => {
    let plugin: PomodoroPlugin;

    beforeEach(async () => {
        const setup = await createStandardTestPlugin();
        plugin = setup.plugin;
    });

    afterEach(async () => {
        await cleanupStandardTestPlugin(plugin);
    });

    it("should start the timer and update display", () => {
        const timer = (plugin as PluginWithPrivates)._timer;

        timer.toggleTimer();
        expect(timer.isRunning).toBe(true);
    });
});
```

### Best Practices

1. **Always use test helpers** - Use `createStandardTestPlugin()` and `cleanupStandardTestPlugin()` instead of manual setup
2. **Clean up intervals** - The cleanup helper automatically stops timers and clears intervals
3. **Organize by feature** - Group tests by functionality, not just by component
4. **Use fake timers** - For time-based tests, use `jest.useFakeTimers()` with `legacyFakeTimers: false`
5. **Test edge cases** - Include tests for invalid inputs, missing elements, and error conditions

## Building and Distribution

### Development Build

=== "PNPM"

    ```bash
    pnpm run dev
    ```

=== "NPM"

    ```bash
    npm run dev
    ```

Builds the plugin with development settings and watches for file changes.

### Production Build

=== "PNPM"

    ```bash
    pnpm run build
    ```

=== "NPM"

    ```bash
    npm run build
    ```

Creates optimized build files:

- `main.js` - Compiled plugin code
- `manifest.json` - Plugin metadata
- `styles.css` - Plugin styles

### Manual Testing

1. Copy built files to `.obsidian/plugins/pomobar/` in a test vault
2. Reload Obsidian
3. Enable the plugin in Community Plugins settings

## Code Style and Standards

### ESLint Configuration

The project uses ESLint with TypeScript support:

```bash
pnpm run lint        # Check for issues
pnpm run lint:fix    # Auto-fix issues
```

### TypeScript

- Strict type checking enabled
- All public APIs must have type annotations
- Prefer interfaces over type aliases for object shapes

### Code Organization

- Keep components focused and single-purpose
- Use clear, descriptive names for functions and variables
- Document complex logic with comments
- Maintain consistent file structure

## Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes and add tests**
4. **Run linting and tests**: `pnpm run lint && pnpm test`
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Pull Request Guidelines

- Include clear description of changes
- Add tests for new functionality
- Ensure all tests pass
- Follow existing code style
- Update documentation if needed

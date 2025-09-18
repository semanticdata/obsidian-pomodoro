# Development Guide

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- pnpm package manager
- Git

### Setup Development Environment

1. **Clone the repository**:

```bash
git clone https://github.com/semanticdata/obsidian-pomodoro.git
cd obsidian-pomodoro
```

2. **Install dependencies**:

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
    - `timer.ts`: The timer logic.
  - `main.ts`: The main entry point for the project.
  - `types.ts`: Contains the project's types.
- `tests/`: Contains the tests for the project.
  - `__mocks__/`: Contains mocks for the tests.
    - `obsidian.ts`: Mocks for the Obsidian API.
  - `plugin.test.ts`: Tests for the plugin.
  - `settings-tab.test.ts`: Tests for the settings tab.
  - `settings.test.ts`: Tests for the settings.
  - `setup.ts`: Setup for the tests.
  - `timer.test.ts`: Tests for the timer.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Build in development mode with file watching |
| `pnpm run build` | Build for production |
| `pnpm run lint` | Run ESLint code analysis |
| `pnpm run lint:fix` | Fix automatically fixable linting issues |
| `pnpm run test` | Run Jest test suite |
| `pnpm run test:watch` | Run tests in watch mode |
| `pnpm run test:coverage` | Generate test coverage report |

## Architecture Overview

### Core Classes

#### PomodoroPlugin (`src/main.ts`)

- Main plugin entry point
- Manages plugin lifecycle and settings
- Coordinates between timer and settings components

#### PomodoroTimer (`src/logic/timer.ts`)

- Handles all timer logic and state management
- Manages status bar display and user interactions
- Controls timer intervals and state transitions

#### PomodoroSettingTab (`src/components/SettingsTab.ts`)

- Provides settings UI within Obsidian preferences
- Handles user input validation and settings persistence

### Key Interfaces

#### PomodoroSettings (`src/types.ts`)

```typescript
interface PomodoroSettings {
    workMinutes: number;              // Work session duration (minutes)
    shortBreakMinutes: number;        // Short break duration (minutes)
    longBreakMinutes: number;         // Long break duration (minutes)
    intervalsBeforeLongBreak: number; // Work sessions before long break
    showIcon: boolean;             // Show/hide timer icon
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

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test component interactions
- **Mock Objects**: Obsidian API is mocked for testing

### Writing Tests

```typescript title="tests/new-test.test.ts"
import { PomodoroTimer } from '../src/logic/timer';
import { mockPlugin, mockSettings } from './__mocks__/obsidian';

describe('PomodoroTimer', () => {
    test('should initialize with correct default state', () => {
        const timer = new PomodoroTimer(mockPlugin, mockSettings, mockElement);
        expect(timer.running).toBe(false);
        expect(timer.timeRemaining).toBe(1500); // 25 minutes in seconds
    });
});
```

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

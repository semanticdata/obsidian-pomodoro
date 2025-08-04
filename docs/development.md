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

   ```bash
   pnpm install
   ```

3. **Start development mode**:

   ```bash
   pnpm run dev
   ```

## Project Structure

```text
├── src/
│   ├── components/
│   │   └── SettingsTab.ts     # Plugin settings UI
│   ├── logic/
│   │   └── timer.ts           # Core timer functionality
│   ├── constants.ts           # Application constants
│   ├── icons.ts              # SVG icon definitions
│   ├── main.ts               # Main plugin class
│   └── types.ts              # TypeScript interfaces
├── tests/                    # Jest test files
├── docs/                     # MkDocs documentation
└── styles.css               # Plugin styles
```

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
    workTime: number;              // Work session duration (minutes)
    shortBreakTime: number;        // Short break duration (minutes)
    longBreakTime: number;         // Long break duration (minutes)
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

```typescript
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

```bash
pnpm run dev
```

Builds the plugin with development settings and watches for file changes.

### Production Build

```bash
pnpm run build
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

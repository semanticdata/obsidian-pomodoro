# Changelog

All notable changes to the PomoBar Obsidian plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project tries to adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-XX-XX (Unreleased)

### 🏗️ **Architecture**

- **BREAKING**: Migrated build system from esbuild to Vite for better development experience
- Completely refactored codebase with modern project structure
- Organized code into logical directories: `src/components/`, `src/logic/`, `src/`
- Centralized constants and types for better maintainability
- Eliminated root main.ts wrapper in favor of direct `src/main.ts` entry point

### ✨ **Features**

- Enhanced icon system with better SVG integration
- Improved timer state management with centralized constants
- Better separation of concerns between UI and business logic

### 🧪 **Testing**

- **MASSIVE** test suite expansion: 15 → 52 tests (+37 tests)
- Achieved 76% overall test coverage (up from ~60%)
- Added comprehensive test files:
  - `tests/plugin.test.ts` - Plugin lifecycle and integration
  - `tests/timer.test.ts` - Timer logic and state management  
  - `tests/settings.test.ts` - Settings persistence
  - `tests/settings-tab.test.ts` - Settings UI component
- Added edge case testing and input validation
- Implemented proper mocking for Obsidian API components
- Added event listener testing (click, middle-click, right-click)

### 🔧 **Developer Experience**

- Switched to Vite for faster builds and better development workflow
- Added watch mode with hot reloading for development
- Improved ESLint configuration and code quality
- Better TypeScript type safety with centralized interfaces
- Comprehensive test coverage reporting

### 🎨 **Code Quality**

- Refactored timer logic into dedicated class with clear interfaces
- Created reusable constants for CSS classes and timer states
- Better error handling and null-safety checks
- Improved code organization and readability
- Enhanced documentation and inline comments

### 📦 **Dependencies**

- Updated to latest development dependencies
- Migrated to pnpm for better package management
- Removed unused esbuild dependencies
- Added Vite and related tooling

### 🐛 **Bug Fixes**

- Fixed TypeScript casting errors in timer implementation
- Improved event registration using Obsidian's proper API
- Better handling of edge cases in timer state transitions
- Fixed potential memory leaks in interval management

## [1.1.0] - 2025-06-11

### ✨ **Features**

- Added comprehensive settings panel for customizing timer behavior
- Configurable work duration (default: 25 minutes)
- Configurable short break duration (default: 5 minutes)  
- Configurable long break duration (default: 15 minutes)
- Configurable intervals before long break (default: 4 work sessions)
- Toggle option for showing/hiding timer icon in status bar

### 🧪 **Testing**

- Created initial test suite with Jest framework
- Added basic plugin lifecycle testing
- Implemented mock system for Obsidian API
- Added timer functionality tests

### 🔧 **Development**

- Organized dependencies and committed to pnpm package manager
- Added proper linting with ESLint
- Improved project structure and formatting

### 📝 **Documentation**

- Updated README with new features and usage instructions
- Added funding information for project support
- Created initial CHANGELOG documentation

## [1.0.0] - 2025-01-30

### 🎉 **Initial Release**

- **Core Timer Functionality**
  - 25-minute Pomodoro timer in Obsidian status bar
  - Visual countdown display (MM:SS format)
  - Audio alert when timer completes
  
- **User Interactions**
  - **Left click**: Start/pause timer
  - **Middle click**: Cycle between work/break durations
  - **Right click**: Reset timer (when paused)
  
- **Visual Feedback**
  - Color transitions for different timer states
  - Active/paused visual indicators
  - Clean, minimalist status bar integration
  
- **Timer States**
  - Work sessions (25 minutes)
  - Short breaks (5 minutes)
  - Long breaks (15 minutes)
  - Automatic progression through Pomodoro cycle

### 🏗️ **Technical Foundation**

- Built as native Obsidian plugin using TypeScript
- Proper event handling and cleanup
- Status bar integration with Obsidian's API
- Lightweight and performant implementation

### 📦 **Project Setup**

- ESLint configuration for code quality
- TypeScript setup for type safety
- MIT license for open source distribution
- Initial package.json and build configuration

---

## Legend

- 🎉 Major features
- ✨ New features  
- 🔧 Developer experience
- 🧪 Testing
- 🐛 Bug fixes
- 🏗️ Architecture changes
- 📦 Dependencies
- 📝 Documentation
- 🎨 Code quality

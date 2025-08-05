# Contributing to PomoBar

First off, thank you for considering contributing to PomoBar! It’s people like you that make the open-source community such a great place. We welcome any and all contributions, from bug reports to feature requests and code changes.

## Quick Start

1.  **Fork and Clone:**
    Fork the repository on GitHub, then clone it locally:
    ```bash
    git clone https://github.com/semanticdata/obsidian-pomodoro.git
    cd obsidian-pomodoro
    ```

2.  **Install Dependencies:**
    ```bash
    pnpm install
    ```

3.  **Start the Dev Server:**
    ```bash
    pnpm dev
    ```

4.  **Test in Obsidian:**
    -   Copy or symlink this project folder to your Obsidian vault's `.obsidian/plugins/` directory.
    -   Reload Obsidian and enable the plugin.

## Development

### Commands

-   `pnpm dev`: Watch for changes and rebuild the plugin automatically.
-   `pnpm build`: Create a production-ready build.
-   `pnpm lint`: Check for code style issues.
-   `pnpm test`: Run the test suite.

### Documentation

The project documentation can be found under the docs/ directory. It is built using [MkDocs](https://www.mkdocs.org/) and Material for MkDocs. To work on the documentation, you'll need a Python environment and `uv`.

1.  **Install `uv`:**
    If you don't have it already, install `uv`:
    ```bash
    pip install uv
    ```

2.  **Sync the Development Environment:**
    This command will create a virtual environment (if it doesn't exist) and install the dependencies from `pyproject.toml`:
    ```bash
    uv sync
    ```

3.  **Run the Docs Server:**
    Use `uv run` to execute `mkdocs` within the managed environment:
    ```bash
    uv run mkdocs serve
    ```
    You can now view the live-reloading documentation site at `http://127.0.0.1:8000`.

4.  **Build the Documentation:**
    To generate the static site, use the `build` command:
    ```bash
    uv run mkdocs build
    ```

## Submitting Changes

1.  **Create a Branch:**
    ```bash
    git checkout -b feature/your-awesome-feature
    ```

2.  **Make Your Changes:**
    -   Ensure your code follows the existing style.
    -   Add tests for any new functionality.
    -   Update documentation if you are changing behavior.

3.  **Commit Your Work:**
    -   Use clear and descriptive commit messages.

4.  **Create a Pull Request:**
    -   Push your branch to your fork and open a pull request.
    -   Provide a detailed description of your changes and link any relevant issues.

Thank you for your contribution!

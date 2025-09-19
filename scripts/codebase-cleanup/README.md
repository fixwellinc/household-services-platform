# FixWell Codebase Cleanup Tool

A comprehensive, enterprise-grade cleanup tool designed specifically for the FixWell Services monorepo. This tool systematically identifies and removes unnecessary files, duplicates, obsolete tests, unused dependencies, and other code artifacts to improve maintainability and reduce technical debt.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
- [Configuration](#configuration)
- [Analyzers](#analyzers)
- [Safety Features](#safety-features)
- [Output Formats](#output-formats)
- [Examples](#examples)
- [Integration](#integration)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Architecture](#architecture)

## Installation

### Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn package manager
- TypeScript (installed automatically as dependency)

### Local Installation

```bash
# Navigate to the cleanup tool directory
cd scripts/codebase-cleanup

# Install dependencies
npm install

# Build the tool
npm run build

# Verify installation
npm run dev -- --help
```

### Global Installation (Optional)

```bash
# Build and link globally
npm run build
npm link

# Now you can use 'cleanup' command from anywhere
cleanup --help
```

## Quick Start

### 1. Basic Analysis (Recommended First Step)

```bash
# Run a safe analysis without making any changes
npm run dev -- analyze --dry-run --verbose

# Or using the built version
node dist/index.js analyze --dry-run --verbose
```

### 2. Generate Configuration File

```bash
# Create a default configuration file
npm run dev -- init-config

# Create with custom path
npm run dev -- init-config --output my-cleanup.config.json
```

### 3. Run Specific Analyzers

```bash
# Run only duplicate file analysis
npm run dev -- analyze --analyzers duplicates --dry-run

# Run dependency analysis
npm run dev -- analyze --analyzers dependencies --dry-run

# Run all analyzers (default)
npm run dev -- analyze --analyzers all --dry-run
```

### 4. Interactive Mode

```bash
# Review each recommendation interactively
npm run dev -- analyze --interactive --dry-run
```

## Commands

### `analyze` (Default Command)

Analyzes the codebase for cleanup opportunities.

```bash
cleanup analyze [options]

# Or simply
cleanup [options]
```

**Options:**
- `-d, --dry-run` - Run analysis without making changes (recommended)
- `-v, --verbose` - Enable detailed output
- `-i, --interactive` - Interactive mode for reviewing changes
- `--config <path>` - Path to configuration file
- `--exclude <patterns>` - Comma-separated exclusion patterns
- `--include <patterns>` - Comma-separated inclusion patterns
- `--analyzers <list>` - Analyzers to run (duplicates,dependencies,all)
- `--output-format <format>` - Output format (console,json,html)
- `--output-file <path>` - Output file path
- `--auto-fix` - Automatically apply safe fixes
- `--max-risk <level>` - Maximum risk level for auto-fixes (safe,review,manual)
- `--min-confidence <level>` - Minimum confidence level (high,medium,low)

**Examples:**
```bash
# Basic analysis with console output
cleanup analyze --dry-run

# Generate JSON report
cleanup analyze --output-format json --output-file cleanup-report.json

# Auto-fix safe issues only
cleanup analyze --auto-fix --max-risk safe

# Run specific analyzers with custom exclusions
cleanup analyze --analyzers duplicates,dependencies --exclude "*.test.*,docs/**"
```

### `execute`

Executes changes from a previous analysis.

```bash
cleanup execute <plan-file> [options]
```

**Options:**
- `-d, --dry-run` - Preview changes without executing
- `-i, --interactive` - Review each change before applying
- `--backup-dir <path>` - Directory for backup files (default: .cleanup-backups)
- `--continue-on-error` - Continue even if individual changes fail
- `--max-risk <level>` - Maximum risk level to execute (safe,review,manual)

**Examples:**
```bash
# Execute changes from a plan file
cleanup execute cleanup-plan.json --dry-run

# Execute with interactive confirmation
cleanup execute cleanup-plan.json --interactive

# Execute only safe changes
cleanup execute cleanup-plan.json --max-risk safe
```

### `rollback`

Rollback previously executed changes.

```bash
cleanup rollback [options]
```

**Options:**
- `--backup-dir <path>` - Directory containing backup files
- `--change-ids <ids>` - Comma-separated list of specific change IDs

**Examples:**
```bash
# Rollback all changes
cleanup rollback

# Rollback specific changes
cleanup rollback --change-ids "change-1,change-2"

# Rollback from custom backup directory
cleanup rollback --backup-dir ./my-backups
```

### `list-analyzers`

Lists all available analyzers and their descriptions.

```bash
cleanup list-analyzers
```

### `init-config`

Generates a default configuration file.

```bash
cleanup init-config [options]
```

**Options:**
- `-o, --output <path>` - Output path for config file (default: cleanup.config.json)

### `safety`

Manages safety settings and whitelist/blacklist patterns.

```bash
cleanup safety [options]
```

**Options:**
- `--add-whitelist <patterns>` - Add patterns to whitelist
- `--add-blacklist <patterns>` - Add patterns to blacklist
- `--remove-whitelist <patterns>` - Remove patterns from whitelist
- `--remove-blacklist <patterns>` - Remove patterns from blacklist
- `--show-config` - Show current safety configuration
- `--interactive` - Interactive safety management

**Examples:**
```bash
# Show current safety settings
cleanup safety --show-config

# Add files to whitelist (never delete these)
cleanup safety --add-whitelist "package.json,tsconfig.json,*.config.*"

# Interactive safety management
cleanup safety --interactive
```

### `benchmark`

Runs performance benchmarks on the cleanup tool.

```bash
cleanup benchmark [options]
```

## Configuration

### Configuration File Format

The tool uses JSON configuration files. Generate a default configuration with:

```bash
cleanup init-config
```

**Default Configuration (`cleanup.config.json`):**
```json
{
  "excludePatterns": [
    "node_modules/**",
    ".git/**",
    "dist/**",
    "build/**",
    "*.log",
    ".cleanup-backups/**"
  ],
  "includePatterns": [
    "**/*"
  ],
  "createBackups": true,
  "dryRun": false,
  "autoFixConfidence": "high",
  "autoFixRiskLevel": "safe"
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `excludePatterns` | string[] | See above | Glob patterns for files to exclude |
| `includePatterns` | string[] | `["**/*"]` | Glob patterns for files to include |
| `createBackups` | boolean | `true` | Create backups before making changes |
| `dryRun` | boolean | `false` | Run in dry-run mode by default |
| `autoFixConfidence` | string | `"high"` | Minimum confidence for auto-fixes |
| `autoFixRiskLevel` | string | `"safe"` | Maximum risk level for auto-fixes |

### Environment-Specific Configurations

Create different configurations for different scenarios:

```bash
# Development environment
cleanup init-config --output cleanup.dev.config.json

# Production environment  
cleanup init-config --output cleanup.prod.config.json

# CI/CD environment
cleanup init-config --output cleanup.ci.config.json
```

## Analyzers

### Available Analyzers

| Analyzer | Description | Risk Level | Auto-fixable |
|----------|-------------|------------|--------------|
| `duplicates` | Finds duplicate files using content hashing | Low-Medium | Yes |
| `dependencies` | Identifies unused npm dependencies | Medium | Yes |
| `dead-code` | Detects unused functions and variables | High | Partial |
| `test-files` | Finds obsolete test files | Medium | Yes |
| `config-files` | Consolidates configuration files | Medium | Partial |
| `file-structure` | Standardizes file naming and structure | High | Partial |

### Analyzer-Specific Options

#### Duplicate File Analyzer
- Identifies files with identical content
- Prioritizes canonical locations (root over subdirectories)
- Handles similar files with minor differences

#### Dependency Analyzer
- Scans all package.json files in monorepo
- Cross-references with actual import statements
- Identifies dev vs production dependency misplacement

#### Dead Code Analyzer
- Uses TypeScript AST parsing
- Tracks import/export relationships
- Preserves API endpoints and public interfaces

## Safety Features

### Built-in Protections

1. **Critical File Protection**: Prevents deletion of essential files
   - `package.json`, `tsconfig.json`, `.gitignore`
   - Configuration files, environment files
   - Build scripts and deployment files

2. **Backup System**: Automatic backups before any changes
   - Stored in `.cleanup-backups/` directory
   - Timestamped and organized by change type
   - Full rollback capability

3. **Risk Assessment**: Every change is categorized by risk level
   - **Safe**: Low-risk changes that can be auto-applied
   - **Review**: Medium-risk changes requiring review
   - **Manual**: High-risk changes requiring manual intervention

4. **Confirmation Prompts**: Interactive confirmation for risky operations
   - Critical file operations
   - Large-scale deletions
   - Structural changes

### Safety Configuration

```bash
# View current safety settings
cleanup safety --show-config

# Add files to never delete (whitelist)
cleanup safety --add-whitelist "*.env,docker-compose.yml"

# Add patterns to always flag for review (blacklist)
cleanup safety --add-blacklist "src/core/**,apps/*/package.json"
```

## Output Formats

### Console Output (Default)

Provides colored, formatted output with progress indicators:

```bash
cleanup analyze --output-format console
```

### JSON Output

Machine-readable format for integration with other tools:

```bash
cleanup analyze --output-format json --output-file report.json
```

**JSON Structure:**
```json
{
  "summary": {
    "totalFiles": 1250,
    "totalFindings": 45,
    "estimatedSavings": {
      "files": 23,
      "diskSpace": "2.3 MB",
      "dependencies": 8
    }
  },
  "categories": {
    "duplicates": { /* analyzer results */ },
    "dependencies": { /* analyzer results */ }
  },
  "recommendations": [ /* array of findings */ ]
}
```

### HTML Output

Detailed web-based report with interactive features:

```bash
cleanup analyze --output-format html --output-file report.html
```

## Examples

See the [examples directory](./examples/) for detailed usage examples:

- [Basic Usage Examples](./examples/basic-usage-examples.md)
- [Advanced Configuration](./examples/advanced-configuration-examples.md)
- [CI/CD Integration](./examples/ci-cd-integration-examples.md)
- [Monorepo Scenarios](./examples/monorepo-scenarios.md)

## Integration

### Build Process Integration

Add cleanup to your build process:

```json
{
  "scripts": {
    "prebuild": "cleanup analyze --auto-fix --max-risk safe",
    "build": "tsc && webpack",
    "postbuild": "cleanup analyze --analyzers dependencies --dry-run"
  }
}
```

### CI/CD Integration

#### GitHub Actions

```yaml
name: Codebase Cleanup
on: [push, pull_request]

jobs:
  cleanup-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd scripts/codebase-cleanup && npm install
      - run: cd scripts/codebase-cleanup && npm run build
      - run: cd scripts/codebase-cleanup && npm run dev -- analyze --dry-run --output-format json --output-file cleanup-report.json
      - uses: actions/upload-artifact@v3
        with:
          name: cleanup-report
          path: scripts/codebase-cleanup/cleanup-report.json
```

#### Pre-commit Hooks

```bash
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: codebase-cleanup
        name: Codebase Cleanup Analysis
        entry: bash -c 'cd scripts/codebase-cleanup && npm run dev -- analyze --dry-run --auto-fix --max-risk safe'
        language: system
        pass_filenames: false
```

### IDE Integration

#### VS Code Tasks

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Cleanup: Analyze",
      "type": "shell",
      "command": "cd scripts/codebase-cleanup && npm run dev -- analyze --dry-run --verbose",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
```

## Troubleshooting

### Common Issues

#### 1. Permission Errors

**Problem**: `EACCES: permission denied`

**Solution**:
```bash
# Check file permissions
ls -la scripts/codebase-cleanup/

# Fix permissions if needed
chmod +x scripts/codebase-cleanup/dist/index.js

# Run with appropriate permissions
sudo npm run dev -- analyze --dry-run
```

#### 2. Memory Issues with Large Codebases

**Problem**: `JavaScript heap out of memory`

**Solution**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev -- analyze --dry-run

# Or use the built-in performance optimization
npm run dev -- analyze --dry-run --exclude "node_modules/**,dist/**,build/**"
```

#### 3. TypeScript Compilation Errors

**Problem**: TypeScript compilation fails during analysis

**Solution**:
```bash
# Check TypeScript configuration
npx tsc --noEmit --project scripts/codebase-cleanup/tsconfig.json

# Update TypeScript if needed
npm update typescript

# Use specific TypeScript version
npm install typescript@5.2.2
```

#### 4. Configuration File Not Found

**Problem**: `Config file not found: cleanup.config.json`

**Solution**:
```bash
# Generate default configuration
npm run dev -- init-config

# Or specify config path explicitly
npm run dev -- analyze --config ./my-config.json --dry-run
```

#### 5. False Positives in Analysis

**Problem**: Tool identifies files as duplicates/unused when they shouldn't be

**Solution**:
```bash
# Add to whitelist
npm run dev -- safety --add-whitelist "path/to/important/file.js"

# Use more specific exclusion patterns
npm run dev -- analyze --exclude "**/*.generated.*,**/vendor/**" --dry-run

# Review and adjust configuration
npm run dev -- safety --show-config
```

### Performance Optimization

#### For Large Monorepos (>10,000 files)

```bash
# Use incremental analysis
npm run dev -- analyze --exclude "node_modules/**,*.log,dist/**,build/**" --dry-run

# Run specific analyzers only
npm run dev -- analyze --analyzers duplicates --dry-run

# Use performance benchmarking
npm run dev -- benchmark --iterations 3
```

#### Memory Usage Optimization

```bash
# Monitor memory usage
npm run dev -- analyze --verbose --dry-run 2>&1 | grep -i memory

# Use streaming for large files
export CLEANUP_STREAM_THRESHOLD=1048576  # 1MB threshold
npm run dev -- analyze --dry-run
```

### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Enable debug output
DEBUG=cleanup:* npm run dev -- analyze --dry-run

# Enable verbose TypeScript compilation
npm run dev -- analyze --verbose --dry-run

# Generate detailed performance report
npm run dev -- benchmark --detailed --output-file performance-report.json
```

### Getting Help

1. **Check the logs**: Look in the `logs/` directory for detailed error information
2. **Run with verbose output**: Use `--verbose` flag for detailed information
3. **Use dry-run mode**: Always test with `--dry-run` first
4. **Check configuration**: Verify your configuration with `cleanup safety --show-config`
5. **Review examples**: Check the examples directory for similar use cases

## Development

### Setting Up Development Environment

```bash
# Clone and setup
git clone <repository-url>
cd scripts/codebase-cleanup

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Build for production
npm run build
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testNamePattern="FileScanner"
npm test -- --testPathPattern="analyzers"

# Run integration tests
npm test -- --testPathPattern="integration"

# Run with watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage --coverageDirectory=coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check

# Run all quality checks
npm run quality-check
```

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLI Interface                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Commands  │ │   Options   │ │   Configuration         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Core Engine                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │File Scanner │ │Orchestrator │ │   Change Executor       ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Analyzers                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │ Duplicates  │ │Dependencies │ │   Dead Code & More      ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Reporters & Safety                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │  Console    │ │ JSON/HTML   │ │   Safety Manager        ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Core Components

- **File Scanner**: Recursively scans repository structure
- **Analysis Orchestrator**: Coordinates analyzer execution
- **Change Executor**: Safely applies changes with backup/rollback
- **Safety Manager**: Enforces safety rules and confirmations
- **Reporters**: Generate output in multiple formats

### Extensibility

The tool is designed for easy extension:

```typescript
// Add custom analyzer
class CustomAnalyzer implements Analyzer {
  async analyze(inventory: FileInventory[]): Promise<AnalysisResult> {
    // Your analysis logic here
  }
}

// Register with orchestrator
orchestrator.registerAnalyzer(new CustomAnalyzer());
```

---

## License

This tool is part of the FixWell Services monorepo and follows the same licensing terms.
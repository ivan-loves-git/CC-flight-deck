# Claude Code Flight Deck

> A visual command center for all your Claude Code customizations

## What Is This?

A local dashboard that shows everything you've customized in Claude Code:
- Commands (your `/slash` shortcuts)
- Agents (specialized AI workers)
- Plugins (installed extensions)
- Hooks (automations)
- Skills (complex capabilities)

## Why?

As a non-developer who customizes Claude Code, I forget what I've built after a few days away. This dashboard gives me a **single glance view** of my entire setup.

## Status

**✅ MVP Complete** - All core features implemented. See [PRD.md](./PRD.md) for full specification.

## Features

- **Real-time scanning** of your `~/.claude/` directory
- **Search** across all customizations
- **Open in VS Code** with one click
- **Dark mode** support (follows system preference)
- **Responsive design** for all screen sizes

## Tech Stack

- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui components
- date-fns for time formatting
- gray-matter for YAML parsing

## Quick Start

### One-Command Launch

```bash
./scripts/start.sh
```

This script will:
1. Install dependencies (if needed)
2. Start the dev server
3. Open your browser to http://localhost:3000

### Manual Start

```bash
npm install
npm run dev
```

Then visit http://localhost:3000

## How It Works

The dashboard scans your `~/.claude/` directory on load:

- **Commands**: Reads `.md` files from `~/.claude/commands/`
- **Agents**: Reads `.md` files from `~/.claude/agents/`
- **Plugins**: Reads `~/.claude/plugins/installed_plugins.json` and `~/.claude/settings.json`
- **Hooks**: Reads all files from `~/.claude/hooks/`
- **Skills**: Reads directories from `~/.claude/skills/`

Click the **Refresh** button to re-scan after making changes to your Claude Code configuration.

## Documentation

- [PRD.md](./PRD.md) - Complete product specification

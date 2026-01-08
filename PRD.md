# PRD: Claude Code Flight Deck

> A visual command center for Claude Code customizations

---

## Document Info

| Field | Value |
|-------|-------|
| Project | ai--CC-flight-deck |
| Author | Ivan (with Claude) |
| Created | January 8, 2025 |
| Status | Planning |
| Version | 1.0 |

---

## Table of Contents

1. [Context: Who I Am](#context-who-i-am)
2. [The Problem](#the-problem)
3. [The Solution](#the-solution)
4. [User Stories](#user-stories)
5. [Information Architecture](#information-architecture)
6. [Technical Specification](#technical-specification)
7. [UI/UX Specification](#uiux-specification)
8. [Implementation Phases](#implementation-phases)
9. [Current Inventory](#current-inventory)
10. [Open Questions](#open-questions)

---

## Context: Who I Am

### My Profile

I am a **business/product person**, not a developer. My background is in strategy, entrepreneurship, and leadership development. I have:

- **Zero formal programming training**
- **Limited terminal/command line experience**
- **No understanding of code architecture or patterns**
- **Strong conceptual and product thinking**

### How I Use Claude Code

I use Claude Code as my **technical co-pilot**. Claude writes the code, I direct the product. Over time, I've accumulated significant customizations:

- Custom commands (shortcuts for common tasks)
- Custom agents (specialized AI workers)
- Plugins (third-party extensions)
- Hooks (automations that run on triggers)
- Skills (complex multi-step capabilities)
- Project-specific configurations

### My Working Pattern

I work in **bursts with gaps**:
- Intensive sessions (hours of focused work)
- Days or weeks between sessions
- Multiple projects in parallel
- Context switching between EMBA, entrepreneurship, AI learning

### The Guidance I Need

Because I'm not a developer, I need Claude to:

1. **Explain decisions** - Not just "do this" but "here's why"
2. **Anticipate problems** - Warn me before I break something
3. **Provide guardrails** - Prevent me from making rookie mistakes
4. **Use simple language** - No jargon without explanation
5. **Be proactive** - Tell me what I should do next
6. **Remember context** - Know my setup, preferences, history

---

## The Problem

### The Core Issue

> "I've built a powerful Claude Code setup, but I can't remember what I have."

After days away from a project, I face these challenges:

| Challenge | Impact |
|-----------|--------|
| **Forgetting commands exist** | I manually do things I've automated |
| **Forgetting what agents do** | I don't use capabilities I've built |
| **Not knowing plugin status** | Features I need might be disabled |
| **Losing project context** | Each project has different configs |
| **No single source of truth** | Info scattered across files/folders |

### Why This Matters

**Time wasted:** Every session starts with "wait, what do I have again?"

**Capabilities unused:** I've invested time building tools I then forget to use

**Cognitive load:** Mental energy spent remembering instead of creating

**Frustration:** Feeling lost in my own system

### Root Cause Analysis

```
WHY do I forget my setup?
  └─ Because there's no visual overview
      └─ WHY is there no overview?
          └─ Because Claude Code is terminal-based
              └─ WHY doesn't terminal work for me?
                  └─ Because I'm visual, not text-oriented
                      └─ WHY does this matter?
                          └─ Because I need to SEE to remember
```

**Insight:** The problem isn't my memory. It's the lack of a **visual, glanceable interface** for my customizations.

---

## The Solution

### Vision Statement

> A local dashboard that shows me everything I've customized in Claude Code, at a glance, with zero maintenance.

### Key Principles

| Principle | Rationale |
|-----------|-----------|
| **Visual first** | I think in images, not text files |
| **Zero maintenance** | I won't update a separate system |
| **Always current** | Must read live from actual files |
| **One click away** | Friction = won't use it |
| **Explanatory** | Show me what things DO, not just that they exist |

### What Success Looks Like

**Before:** "Let me check... where are my commands? What was that agent called? Is that plugin enabled?"

**After:** *Click menu bar icon* → See everything → "Ah right, I have `/ralph-run` for autonomous coding" → Get to work

### Metaphor: Flight Deck

Like a pilot's cockpit:
- All instruments visible at once
- Each gauge shows status at a glance
- Organized by function
- No digging through manuals

---

## User Stories

### Must Have (v1.0)

#### Commands

| ID | Story | Rationale |
|----|-------|-----------|
| US-01 | As Ivan, I want to see all my `/commands` in a list | Commands are my most-used customization |
| US-02 | As Ivan, I want to see each command's description | So I know what it does without opening the file |
| US-03 | As Ivan, I want to see when each command was last modified | To know what's recent vs. old |
| US-04 | As Ivan, I want to click a command to open it in VS Code | So I can edit or review the full content |

#### Agents

| ID | Story | Rationale |
|----|-------|-----------|
| US-05 | As Ivan, I want to see my custom agents | I forget I have specialized agents |
| US-06 | As Ivan, I want to see what each agent does | Agent names aren't always descriptive |

#### Plugins

| ID | Story | Rationale |
|----|-------|-----------|
| US-07 | As Ivan, I want to see installed plugins | To know what extensions are available |
| US-08 | As Ivan, I want to see if plugins are enabled or disabled | A disabled plugin is invisible in Claude |

#### Hooks & Skills

| ID | Story | Rationale |
|----|-------|-----------|
| US-09 | As Ivan, I want to see my hooks | Hooks run automatically; I need to know what's active |
| US-10 | As Ivan, I want to see my skills | Skills are complex; easy to forget they exist |

### Should Have (v1.1)

| ID | Story | Rationale |
|----|-------|-----------|
| US-11 | As Ivan, I want to search across all items | When I vaguely remember something exists |
| US-12 | As Ivan, I want to see which projects have Claude configs | To understand project-level customization |
| US-13 | As Ivan, I want to filter by category | To focus on one type at a time |

### Could Have (v2.0)

| ID | Story | Rationale |
|----|-------|-----------|
| US-14 | As Ivan, I want to add personal notes to items | To capture context that files don't contain |
| US-15 | As Ivan, I want to see usage statistics | To know what I actually use vs. what I built |
| US-16 | As Ivan, I want quick actions (enable/disable) | To manage without opening terminal |

---

## Information Architecture

### Data Sources

Claude Code stores everything in `~/.claude/`. Here's what we'll scan:

```
~/.claude/
├── commands/          ← Slash commands (*.md files)
├── agents/            ← Custom agents (*.md files)
├── hooks/             ← Automation scripts
├── skills/            ← Complex skills (folders)
├── plugins/           ← Plugin data
│   └── installed_plugins.json
├── settings.json      ← Enabled plugins, permissions
└── CLAUDE.md          ← Global instructions
```

Plus project-level configs:

```
~/Progetti/*/
└── .claude/
    ├── commands/      ← Project-specific commands
    └── CLAUDE.md      ← Project instructions
```

### Data Model

#### Command
```typescript
interface Command {
  name: string;           // e.g., "commit"
  path: string;           // Full file path
  description: string;    // From YAML frontmatter
  lastModified: Date;     // File modification time
  scope: 'global' | 'project';
  projectName?: string;   // If project-scoped
}
```

#### Agent
```typescript
interface Agent {
  name: string;
  path: string;
  description: string;    // First paragraph of content
  lastModified: Date;
}
```

#### Plugin
```typescript
interface Plugin {
  name: string;
  version: string;
  enabled: boolean;       // From settings.json
  installedAt: Date;
  source: string;         // e.g., "claude-code-marketplace"
}
```

#### Hook
```typescript
interface Hook {
  name: string;
  path: string;
  type: 'shell' | 'node' | 'other';
  lastModified: Date;
}
```

#### Skill
```typescript
interface Skill {
  name: string;
  path: string;
  description: string;
  lastModified: Date;
}
```

### Dashboard Sections

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   CLAUDE CODE FLIGHT DECK                        🔍 Search      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   COMMANDS ───────────────────────────────────────────── (11)   │
│   Your slash commands - type these in Claude Code              │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ /commit           Detailed commits with emojis   2d ago │   │
│   │ /commit-tm        Task Master commits            Today  │   │
│   │ /ralph-init       Initialize Ralph project       Today  │   │
│   │ /ralph-run        Run Ralph autonomous loop      Today  │   │
│   │ /ralph-status     Check Ralph progress           Today  │   │
│   │ /session-start    Begin a work session           3w ago │   │
│   │ /session-end      End a work session             3w ago │   │
│   │ ...                                                     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   AGENTS ─────────────────────────────────────────────── (2)    │
│   Specialized AI workers for specific tasks                     │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 🤖 report-generator      Transform research → reports   │   │
│   │ 🤖 research-synthesizer  Consolidate multiple sources   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   PLUGINS ──────────────────────────────────────── (7/8 on)     │
│   Third-party extensions adding capabilities                    │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ ✅ plan                    Planning workflows           │   │
│   │ ✅ frontend-design         UI/UX design assistance      │   │
│   │ ✅ feature-dev             Feature development          │   │
│   │ ✅ pr-review-toolkit       PR reviews                   │   │
│   │ ✅ nextjs-vercel-pro       Next.js + Vercel             │   │
│   │ ✅ project-management      Project management           │   │
│   │ ✅ claude-hud              Status line display          │   │
│   │ ❌ documentation-generator Docs (disabled)              │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   HOOKS ──────────────────────────────────────────────── (1)    │
│   Automations that run on triggers                              │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ ⚡ check-voice-memos.sh    Shell script         5d ago  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   SKILLS ─────────────────────────────────────────────── (4)    │
│   Complex multi-step capabilities                               │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 🎯 communicator           Voice & style matching        │   │
│   │ 🎯 content-creator        Content across formats        │   │
│   │ 🎯 notion-sync            Sync with Notion              │   │
│   │ 🎯 meeting-screener       Meeting evaluation            │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ─────────────────────────────────────────────────────────     │
│   Last scanned: Just now                        ↻ Refresh       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Specification

### Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 14+ | Ivan's familiar with it from other projects |
| UI Library | shadcn/ui | Consistent with emba--renew-platform |
| Styling | Tailwind CSS | Pairs with shadcn/ui |
| Language | TypeScript | Type safety, better IDE support |
| Runtime | Node.js | Already installed on Ivan's machine |

### shadcn/ui Components (Mandatory)

All UI must use shadcn/ui components:

| Component | Usage |
|-----------|-------|
| `Card` | Container for each item |
| `CardHeader` | Item name and icon |
| `CardDescription` | Item description |
| `Badge` | Status (enabled/disabled, scope) |
| `Button` | Actions (Open, Refresh) |
| `Input` | Search bar |
| `ScrollArea` | Scrollable sections |
| `Collapsible` | Expandable project list |
| `Tabs` | Optional category navigation |
| `Tooltip` | Hover for more info |
| `Separator` | Visual section dividers |

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     FLIGHT DECK APP                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Scanner    │───▶│   API        │───▶│   UI         │ │
│  │   Service    │    │   Routes     │    │   Components │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                                       │          │
│         ▼                                       ▼          │
│  ┌──────────────┐                      ┌──────────────┐   │
│  │  ~/.claude/  │                      │  Browser     │   │
│  │  (files)     │                      │  Window      │   │
│  └──────────────┘                      └──────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### File Structure

```
ai--CC-flight-deck/
├── README.md                 # Project overview
├── PRD.md                    # This document
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── components.json           # shadcn/ui config
│
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Main dashboard
│   │   └── api/
│   │       └── scan/
│   │           └── route.ts  # API endpoint
│   │
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── dashboard/
│   │   │   ├── Header.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── CommandList.tsx
│   │   │   ├── AgentList.tsx
│   │   │   ├── PluginList.tsx
│   │   │   ├── HookList.tsx
│   │   │   ├── SkillList.tsx
│   │   │   └── ItemCard.tsx
│   │   └── shared/
│   │       └── OpenInEditor.tsx
│   │
│   ├── lib/
│   │   ├── scanner/
│   │   │   ├── index.ts      # Main scanner
│   │   │   ├── commands.ts   # Scan commands
│   │   │   ├── agents.ts     # Scan agents
│   │   │   ├── plugins.ts    # Scan plugins
│   │   │   ├── hooks.ts      # Scan hooks
│   │   │   └── skills.ts     # Scan skills
│   │   ├── utils.ts
│   │   └── types.ts
│   │
│   └── styles/
│       └── globals.css
│
├── public/
│   └── favicon.ico
│
└── scripts/
    └── start.sh              # One-command launcher
```

### Scanner Logic

#### Commands Scanner

```typescript
// Pseudocode for scanning commands
async function scanCommands(): Promise<Command[]> {
  const globalPath = '~/.claude/commands/';
  const files = await glob(globalPath + '*.md');

  return files.map(file => {
    const content = readFile(file);
    const frontmatter = parseYAML(content);  // Extract --- block
    const stats = getFileStats(file);

    return {
      name: basename(file, '.md'),
      path: file,
      description: frontmatter.description || 'No description',
      lastModified: stats.mtime,
      scope: 'global'
    };
  });
}
```

#### YAML Frontmatter Parsing

Commands have this format:

```markdown
---
description: "What this command does"
allowed-tools: [...]
---

# Command content...
```

We extract the `description` field for display.

### API Design

#### GET /api/scan

Returns all Claude Code customizations:

```typescript
interface ScanResponse {
  scannedAt: string;
  commands: Command[];
  agents: Agent[];
  plugins: Plugin[];
  hooks: Hook[];
  skills: Skill[];
}
```

### Launch Script

```bash
#!/bin/bash
# scripts/start.sh

cd "$(dirname "$0")/.."
npm run dev &
sleep 2
open http://localhost:3000
```

---

## UI/UX Specification

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Scannable** | Large text, clear hierarchy, icons |
| **Informative** | Description visible without clicking |
| **Actionable** | "Open" button always visible |
| **Fresh** | Show last scan time, easy refresh |
| **Consistent** | Same card design for all item types |

### Visual Hierarchy

1. **Header** - App title, search bar
2. **Sections** - One per category (Commands, Agents, etc.)
3. **Section Header** - Category name, count, brief explanation
4. **Items** - Cards with name, description, metadata
5. **Footer** - Last scan time, refresh button

### Color Coding

| Element | Color | Meaning |
|---------|-------|---------|
| Enabled badge | Green | Active/enabled |
| Disabled badge | Gray | Inactive/disabled |
| Global scope | Blue | Available everywhere |
| Project scope | Purple | Project-specific |
| Recent (< 24h) | Highlighted | Recently modified |

### Responsive Behavior

| Viewport | Layout |
|----------|--------|
| Desktop (> 1024px) | Full width, comfortable spacing |
| Tablet (768-1024px) | Slightly condensed |
| Mobile (< 768px) | Single column, stacked cards |

Primary use is desktop, but tablet should work for quick checks.

---

## Implementation Phases

### Phase 1: Foundation (MVP)

**Goal:** Working dashboard with core categories

| Task | Description | Complexity |
|------|-------------|------------|
| 1.1 | Project setup (Next.js + shadcn/ui) | Low |
| 1.2 | Commands scanner + display | Medium |
| 1.3 | Agents scanner + display | Low |
| 1.4 | Plugins scanner + display | Medium |
| 1.5 | Hooks scanner + display | Low |
| 1.6 | Skills scanner + display | Low |
| 1.7 | "Open in VS Code" action | Low |
| 1.8 | Basic styling | Medium |

**Deliverable:** Dashboard showing all 5 categories with descriptions and open action.

### Phase 2: Polish

**Goal:** Better UX and more information

| Task | Description | Complexity |
|------|-------------|------------|
| 2.1 | Search across all items | Medium |
| 2.2 | Last modified timestamps | Low |
| 2.3 | Project-level command scanning | Medium |
| 2.4 | Visual design improvements | Medium |
| 2.5 | Auto-refresh on window focus | Low |

**Deliverable:** Polished dashboard with search and timestamps.

### Phase 3: Menu Bar (v2.0)

**Goal:** Always-accessible menu bar app

| Task | Description | Complexity |
|------|-------------|------------|
| 3.1 | Electron wrapper | High |
| 3.2 | Menu bar icon | Medium |
| 3.3 | Background process | Medium |
| 3.4 | Keyboard shortcut | Low |

**Deliverable:** Menu bar app that opens dashboard in popup.

---

## Current Inventory

### Commands (11 Global)

| Name | Description | Last Modified |
|------|-------------|---------------|
| commit | Detailed commits with emojis | Dec 2024 |
| commit-tm | Task Master commits | Jan 8, 2025 |
| meeting-screener | Meeting evaluation | Nov 2024 |
| milestone-review | Milestone reviews | Dec 2024 |
| plan | Project planning | Dec 2024 |
| ralph-init | Initialize Ralph | Jan 8, 2025 |
| ralph-run | Run Ralph loop | Jan 8, 2025 |
| ralph-status | Check Ralph progress | Jan 8, 2025 |
| session-end | End work session | Dec 2024 |
| session-start | Start work session | Dec 2024 |
| setup-check | Setup verification | Dec 2024 |

### Agents (2)

| Name | Purpose |
|------|---------|
| report-generator | Transform research findings into structured reports |
| research-synthesizer | Consolidate findings from multiple research sources |

### Plugins (8 installed, 7 enabled)

| Name | Source | Status |
|------|--------|--------|
| plan | claude-code-marketplace | Enabled |
| nextjs-vercel-pro | claude-code-templates | Enabled |
| frontend-design | claude-code-plugins | Enabled |
| feature-dev | claude-code-plugins | Enabled |
| pr-review-toolkit | claude-code-plugins | Enabled |
| project-management-suite | claude-code-templates | Enabled |
| claude-hud | claude-hud | Enabled |
| documentation-generator | claude-code-marketplace | **Disabled** |

### Hooks (1)

| Name | Type |
|------|------|
| check-voice-memos.sh | Shell script |

### Skills (4)

| Name | Purpose |
|------|---------|
| communicator | Voice and style matching |
| content-creator | Content across formats |
| notion-sync | Notion synchronization |
| meeting-screener | Meeting evaluation |

---

## Open Questions

| # | Question | Impact | Notes |
|---|----------|--------|-------|
| 1 | Which editor for "Open" action? | Low | Assume VS Code |
| 2 | Should we scan all Progetti or whitelist? | Medium | Start with all, optimize if slow |
| 3 | Cache scan results or always live? | Medium | Start live, add cache if needed |
| 4 | Include project-level configs in v1? | Medium | Probably v1.1 |
| 5 | Auto-launch on Mac startup? | Low | v2 feature |

---

## Appendix A: Claude Code File Locations

```
~/.claude/
├── commands/           # Global slash commands
├── agents/             # Custom agents
├── hooks/              # Automation hooks
├── skills/             # Complex skills
├── plugins/
│   ├── cache/          # Downloaded plugin files
│   ├── installed_plugins.json
│   └── known_marketplaces.json
├── settings.json       # Enabled plugins, permissions
├── settings.local.json # Local overrides
├── CLAUDE.md           # Global instructions
├── history.jsonl       # Conversation history
├── projects/           # Project-specific data
└── todos/              # Todo lists
```

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Command** | A slash command (e.g., `/commit`) that triggers specific behavior |
| **Agent** | A specialized AI worker with specific instructions and tools |
| **Plugin** | Third-party extension from a marketplace |
| **Hook** | Script that runs automatically on certain triggers |
| **Skill** | Complex capability, often with multiple files |
| **Frontmatter** | YAML metadata at the top of a markdown file |
| **shadcn/ui** | Component library built on Radix UI and Tailwind |

---

## Appendix C: Related Projects

| Project | Relationship |
|---------|--------------|
| ai--ralph-skill | Ralph commands originated here |
| emba--renew-platform | Uses same tech stack, has Task Master |

---

*This PRD is a living document. Update as decisions are made.*

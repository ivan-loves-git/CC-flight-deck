# term-diary Skill: Problem Statement

**Date**: 2026-01-21
**Status**: Broken - Requires Fix
**Priority**: High

---

## Executive Summary

The `term-diary` skill is designed to process Claude Code session logs (JSONL files) into structured markdown diary entries that feed a productivity dashboard. The skill is currently broken in two critical ways:

1. **AI-generated content sections are never filled** - Output files contain placeholder text instead of actual summaries
2. **Data extraction quality is poor** - The dashboard requires detailed usage metrics (commands, agents, MCPs) but the extractor captures almost none of this data correctly

This document provides complete context for fixing these issues.

---

## System Architecture Overview

### What is Claude Code?

Claude Code is Anthropic's CLI tool for AI-assisted software development. Users interact with Claude through a terminal, and every conversation is logged as a JSONL file containing:

- User messages (prompts, commands)
- Assistant responses (code, explanations)
- Tool calls (file edits, bash commands, agent spawns, MCP integrations)
- Timestamps for all interactions

### What is term-diary?

A "skill" (custom automation) that:
1. Reads Claude Code JSONL session files
2. Extracts metrics and conversation content
3. Outputs structured markdown files
4. These markdown files feed a productivity dashboard

### File Locations

```
Source files (JSONL sessions):
~/.claude/projects/{project-folder}/*.jsonl

Skill implementation:
~/.claude/skills/term-diary/
├── process-claude-session.py    # Python extractor
├── SKILL.md                     # Skill definition and AI instructions
├── TEMPLATE.md                  # Output format reference
├── usage-aggregates.json        # Historical usage tracking
└── PROBLEM_STATEMENT.md         # This document (copy)

Output files:
~/Library/Mobile Documents/com~apple~CloudDocs/Progetti/_archive/CC Logs/
└── YYYY-MM-DD_project_XXmin_uuid8.md
```

### Intended Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  JSONL Session  │────▶│  Python Script  │────▶│  .md with       │────▶│  Final .md      │
│  (raw logs)     │     │  (extraction)   │     │  [AI_GENERATE]  │     │  (complete)     │
└─────────────────┘     └─────────────────┘     │  placeholders   │     └─────────────────┘
                                                └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  AI fills       │
                                                │  placeholders   │
                                                │  (NOT WORKING)  │
                                                └─────────────────┘
```

---

## Problem 1: AI Content Generation Phase Missing

### Symptom

All processed markdown files contain unfilled placeholder text:

```markdown
## Executive Summary
[AI_GENERATE: Read the Conversation Log below and write 1-2 paragraphs describing what was accomplished.]

## Achievements
[AI_GENERATE: List 1-5 concrete accomplishments. Start each with past-tense verb.]

## Lessons Learned
[AI_GENERATE: Extract insights. If none, DELETE THIS SECTION.]
```

### Expected Behavior

The SKILL.md file defines a two-phase process:

**Phase 1 (Python)**: Extract data from JSONL, create markdown with YAML frontmatter, conversation log, and `[AI_GENERATE]` placeholders

**Phase 2 (AI)**: Read each output file, analyze the Conversation Log section, and replace placeholders with intelligent summaries

### Actual Behavior

Phase 1 runs correctly. Phase 2 never executes.

### Root Cause

The Python script (`process-claude-session.py`) outputs files with placeholders and exits. There is no orchestration logic that:
1. Detects files with `[AI_GENERATE]` placeholders
2. Triggers AI to read and process them
3. Saves the completed versions

When users run the skill via `/term-diary` command, or directly via `python3 ... --today`, only Phase 1 executes.

### Required Fix

Implement Phase 2 orchestration:

```python
# Pseudocode for what's missing
for each file in output_directory:
    if file contains "[AI_GENERATE]":
        content = read_file(file)
        conversation_log = extract_section(content, "Conversation Log")

        executive_summary = ai_generate(
            prompt="Write 1-2 paragraphs summarizing this session",
            context=conversation_log
        )
        achievements = ai_generate(
            prompt="List 1-5 concrete accomplishments",
            context=conversation_log
        )
        lessons = ai_generate(
            prompt="Extract insights, or return NONE",
            context=conversation_log
        )

        content = replace_placeholder(content, "Executive Summary", executive_summary)
        content = replace_placeholder(content, "Achievements", achievements)
        if lessons == "NONE":
            content = remove_section(content, "Lessons Learned")
        else:
            content = replace_placeholder(content, "Lessons Learned", lessons)

        write_file(file, content)
```

---

## Problem 2: Poor Data Extraction Quality

This is the more complex problem. The dashboard requires detailed usage metrics that the current extractor fails to capture.

### 2.1 Dashboard Data Requirements

The productivity dashboard (screenshots provided separately) displays these widgets:

#### TOP COMMANDS Widget
Shows slash commands used with counts:
```
/plan          907
/commit        428
/term-diary     54
/communicator   16
/content-creator 13
/commit-tm      11
/ralph-run       7
/feature-dev:feature-dev  7
/claude-hud:setup  5
/milestone-review  4
/ralph-init      4
/ralph-status    4
/notion-sync     4
/meeting-screener 3
```

#### TOP AGENTS Widget
Shows spawned agents with counts:
```
Explore        142611
Plan            1147
code-reviewer     16
report-generator   0
research-synthesizer  0
feature-dev:code-architect  0
feature-dev:code-explorer   0
feature-dev:code-reviewer   0
```

#### TOP PROJECTS Widget
Shows projects with total time:
```
renew-platform      56h 35m
south-africa-seminar  18h
CC-flight-deck      12h 31m
presentation-creator  6h
ralph-skill          3h
femba                3h
```

#### Other Widgets Requiring Data
- COMMANDS RANKED (all commands sorted by frequency)
- AGENTS RANKED (all agents sorted by spawn count)
- PRODUCTIVITY metrics (Cmd/Hour, Agent/Hr)
- COMMITS count
- 5-WEEK HEATMAP (daily activity)
- RECENT SESSIONS (date, project, duration)

### 2.2 Current Output Quality

Example YAML frontmatter from a processed file:

```yaml
---
session_id: "a9f91302-a704-421a-806e-3418f3c30947"
source_log: "a9f91302-a704-421a-806e-3418f3c30947.jsonl"
date: "2026-01-21"
start_time: "14:25"
end_time: "15:12"
window_minutes: 47
active_minutes: 25
active_percentage: 53.2
project: "Progetti"
skills_used:
  term-diary: 2
agents_spawned:
  general-purpose: 6
  Explore: 1
mcps_used: {}
commits_made: 0
---
```

### 2.3 Specific Data Quality Issues

#### Issue 2.3.1: Missing `commands_used` Field

**Template expects:**
```yaml
commands_used:
  /commit: 3
  /plan: 1
```

**Actual output:** Field does not exist at all.

**Impact:** Dashboard cannot populate TOP COMMANDS, COMMANDS RANKED, or calculate Cmd/Hour.

**Technical cause:** The Python script has a `KNOWN_SKILLS` list and searches for `/skill-name` in user messages, but:
- It stores results in `skills_used` not `commands_used`
- Commands and skills are conflated (they're different concepts)
- The search is case-sensitive and fragile

#### Issue 2.3.2: Incomplete Command Detection

**Dashboard shows 48 distinct items** (commands, agents, plugins, hooks, skills) but the Python script only knows about ~15:

```python
# Current hardcoded list in process-claude-session.py
KNOWN_SKILLS = [
    'content-creator', 'communicator', 'ge-communicator', 'notion-sync',
    'mail-save', 'meeting-screener', 'web-design-guidelines', 'frontend-design',
    'react-best-practices', 'vercel-deploy', 'term-diary', 'commit', 'plan',
    'feature-dev', 'review-pr', 'session-start', 'session-end',
]
```

**Missing commands not detected:**
- `/communicator` (different from skill name)
- `/claude-hud:setup`
- `/feature-dev:feature-dev`
- `/feature-dev:code-reviewer`
- `/feature-dev:code-explorer`
- `/feature-dev:code-architect`
- `/ralph-init`
- `/ralph-run`
- `/ralph-status`
- `/milestone-review`
- `/commit-tm`
- Many others

**Impact:** Usage counts are drastically undercounted. Dashboard shows `/plan` used 907 times, but term-diary captures only a fraction.

#### Issue 2.3.3: Agent Detection Problems

**Dashboard shows these agents:**
- Explore (142,611 spawns)
- Plan (1,147 spawns)
- code-reviewer (16 spawns)
- report-generator
- research-synthesizer
- feature-dev:code-architect
- feature-dev:code-explorer
- feature-dev:code-reviewer

**Current hardcoded list:**
```python
KNOWN_AGENTS = [
    'Explore', 'Plan', 'general-purpose', 'code-reviewer', 'code-explorer',
    'code-architect', 'silent-failure-hunter', 'code-simplifier',
    'comment-analyzer', 'pr-test-analyzer', 'type-design-analyzer',
    'frontend-developer', 'fullstack-developer', 'product-strategist',
    'business-analyst', 'research-synthesizer', 'report-generator',
]
```

**Problems:**
1. `general-purpose` appears in output but NOT in dashboard - naming mismatch
2. Prefixed agents like `feature-dev:code-reviewer` may not match
3. The `extract_tool_usage()` function looks for `name="Task"` tool calls, but may not handle all variants

#### Issue 2.3.4: MCP Detection Failing

**Expected:** MCPs (Model Context Protocol integrations) like notion, github, context7, claude-in-chrome should be detected.

**Actual output:**
```yaml
mcps_used: {}
```

Empty. Zero MCPs detected despite heavy usage.

**Technical cause:** The `extract_tool_usage()` function searches for `mcp__*` prefixed tool names:

```python
elif tool_name.startswith('mcp__'):
    parts = tool_name.split('__')
    if len(parts) >= 2:
        mcp_name = parts[1]
        mcps_used[mcp_name] += 1
```

This logic appears correct, but produces no results. Possible causes:
- Tool names may be stored differently in JSONL
- The function may be scanning the wrong message types
- Content structure may have changed

#### Issue 2.3.5: Tools & Integrations Table Missing

**Template expects a table:**
```markdown
## Tools & Integrations

| Category | Item | Count | Context |
|----------|------|-------|---------|
| Commands | /commit | 3 | After parser, timezone fix, idle gaps |
| Commands | /plan | 1 | Planning importer architecture |
| Agents | Explore | 5 | Codebase navigation |
| MCPs | notion | 4 | Syncing project notes |
| Skills | ge-communicator | 2 | Drafting status update |
```

**Actual output:** Section does not exist.

**Impact:** No consolidated view of tool usage with context.

#### Issue 2.3.6: No Dynamic Discovery

The system relies on hardcoded lists (`KNOWN_SKILLS`, `KNOWN_AGENTS`, `KNOWN_MCPS`) instead of dynamically discovering what's used.

**Better approach:**
- Scan JSONL for ALL tool_use blocks
- Extract names dynamically
- Group by category (command, agent, MCP, skill)
- No hardcoded lists needed

### 2.4 JSONL Structure Reference

For the fixer to understand what to parse, here's the JSONL structure:

#### User Message Entry
```json
{
  "type": "user",
  "timestamp": "2026-01-21T14:25:00.000Z",
  "message": {
    "role": "user",
    "content": "/plan help me build a new feature"
  }
}
```

#### Assistant Message with Tool Use
```json
{
  "type": "assistant",
  "timestamp": "2026-01-21T14:25:30.000Z",
  "message": {
    "id": "msg_123abc",
    "role": "assistant",
    "content": [
      {
        "type": "text",
        "text": "I'll help you plan this feature..."
      },
      {
        "type": "tool_use",
        "id": "tool_456",
        "name": "Task",
        "input": {
          "subagent_type": "Explore",
          "prompt": "Find relevant files..."
        }
      },
      {
        "type": "tool_use",
        "id": "tool_789",
        "name": "mcp__notion__search",
        "input": {
          "query": "project notes"
        }
      },
      {
        "type": "tool_use",
        "id": "tool_012",
        "name": "Skill",
        "input": {
          "skill": "commit",
          "args": "-m 'feat: add feature'"
        }
      }
    ]
  }
}
```

**Key extraction points:**
- Commands: User messages starting with `/`
- Agents: `tool_use` blocks where `name="Task"`, extract `input.subagent_type`
- MCPs: `tool_use` blocks where `name` starts with `mcp__`, extract second segment
- Skills: `tool_use` blocks where `name="Skill"`, extract `input.skill`

### 2.5 Data Quality Summary Table

| Data Type | Dashboard Expects | Current Output | Gap |
|-----------|------------------|----------------|-----|
| Commands | Per-command counts (/plan: 907) | Not captured | **Critical** |
| Skills | Per-skill counts | Partially captured | **Partial** |
| Agents | Per-agent counts (Explore: 142611) | Partially captured, naming issues | **Partial** |
| MCPs | Per-MCP counts | Empty `{}` | **Critical** |
| Tools table | Category/Item/Count/Context | Not generated | **Missing** |
| Project time | Hours per project | Minutes only, naming varies | **Needs work** |

---

## Files to Modify

### Primary: `~/.claude/skills/term-diary/process-claude-session.py`

Current size: ~760 lines

Key functions needing fixes:
- `extract_tool_usage()` - MCP detection broken, needs dynamic discovery
- `process_session()` - Missing commands_used field, missing Tools table generation
- Hardcoded lists need replacement with dynamic detection

### Secondary: `~/.claude/skills/term-diary/SKILL.md`

Needs update to include Phase 2 orchestration instructions or separate orchestrator.

---

## Acceptance Criteria

### For Problem 1 (AI Generation)
- [ ] No `[AI_GENERATE]` placeholders remain in output files
- [ ] Executive Summary contains 1-2 paragraphs based on Conversation Log
- [ ] Achievements contains 1-5 bullet points with past-tense verbs
- [ ] Lessons Learned either contains insights OR section is deleted entirely

### For Problem 2 (Data Quality)
- [ ] `commands_used` field present with per-command counts
- [ ] All commands detected (not just hardcoded subset)
- [ ] All agents detected with correct naming (matching dashboard)
- [ ] MCPs detected and counted (not empty)
- [ ] Tools & Integrations table generated
- [ ] Dynamic discovery - no hardcoded KNOWN_* lists
- [ ] Re-processing same session produces identical counts (idempotent)

### Verification

Run on existing sessions and compare:
1. Process a session with known heavy tool usage
2. Manually count tool_use blocks in JSONL
3. Verify output YAML matches manual count
4. Verify dashboard widgets can consume the data

---

## Appendix: Related Files

### usage-aggregates.json Structure

Historical tracking file that accumulates across sessions:

```json
{
  "lastUpdated": "2026-01-21T15:56:49.385773",
  "totalSessions": 21,
  "dateRange": {"from": "2026-01-10", "to": "2026-01-21"},
  "skills": {
    "term-diary": {"total": 4, "byDate": {"2026-01-21": 4}, "lastUsed": "2026-01-21"}
  },
  "agents": {
    "Explore": {"total": 2, "byDate": {"2026-01-21": 2}, "lastUsed": "2026-01-21"}
  },
  "mcps": {},
  "projects": {
    "Progetti": {"sessions": 15, "totalMinutes": 200, "lastWorked": "2026-01-21"}
  },
  "processedSessions": ["uuid1", "uuid2", "..."]
}
```

This file also needs fixing once per-session data is accurate.

### Dashboard Item Database

The CC-flight-deck project maintains a database of 48 items:
- Type: Command, Agent, Plugin, Hook, Skill
- Name: /plan, /commit, Explore, etc.
- Scope: global, project
- Usage counts

This could serve as a reference for expected item names.

# Problem Statement: /diary-CClogs Skill

**Purpose**: This document defines requirements for building a NEW skill to process Claude Code session logs. Another AI will implement this from scratch.

**Context**: The existing `/term-diary` skill is broken beyond repair. We're building `/diary-CClogs` fresh.

---

## 1. THE PROBLEM

### 1.1 What Exists Today

Claude Code (Anthropic's CLI) generates JSONL log files for every terminal session:
- Location: `~/.claude/projects/{project-folder}/*.jsonl`
- Contents: User messages, AI responses, tool calls, timestamps
- Size: Large (megabytes per session), noisy, unstructured

### 1.2 What the User Needs

A **productivity dashboard** that shows:
- Time spent per project
- Tools/skills/agents/MCPs used (with counts)
- Session summaries and achievements
- Activity patterns over time

### 1.3 Why Current Approach Failed

The broken `/term-diary` skill:
1. **AI summaries never generated** - Outputs `[AI_GENERATE]` placeholders that nothing fills
2. **Tool detection broken** - MCPs return empty `{}`, commands not tracked at all
3. **Project detection wrong** - Uses starting folder, not actual work location
4. **Python produces unverifiable results** - User can't debug or validate
5. **Hardcoded tool lists** - Misses most installed skills/agents

---

## 2. USER REQUIREMENTS (from interview)

### 2.1 Architecture Decision: AI-First

> "I'm open to Claude Code doing everything. Python only for obvious noise patterns if needed."

**Implication**: Build with Claude Code as primary processor. Minimize Python. If Python used, only for truly mechanical preprocessing.

### 2.2 Tool Tracking Categories

**TRACK these:**
| Category | Example | How to Detect in JSONL |
|----------|---------|----------------------|
| Commands | /plan, /commit, /term-diary | User message starts with `/` |
| Skills | commit, communicator | `tool_use` where `name="Skill"`, extract `input.skill` |
| Agents | Explore, Plan, code-reviewer | `tool_use` where `name="Task"`, extract `input.subagent_type` |
| MCPs | notion, github, context7 | `tool_use` where `name` starts with `mcp__` |

**DO NOT TRACK these:**
- Basic Claude tools: Read, Write, Edit, Bash, Glob, Grep, etc.
- Git operations: commits, pushes, pulls
- File system operations

### 2.3 Tool Discovery - CRITICAL

> "I install skills, plugins and MCPs constantly. Either scan usual folders before searching the log, or AI prompts me when finding new ones."

**Requirements**:
1. Before processing any log, scan for currently installed tools:
   - `~/.claude/skills/` - installed skills
   - `.mcp.json` files - MCP configurations
2. If log contains unknown tool → ASK USER during processing
3. No hardcoded `KNOWN_SKILLS` or `KNOWN_AGENTS` lists

### 2.4 Project Detection - CRITICAL

> "Logs start in Progetti folder but 90% develop into subproject folders. I need accurate project attribution."

**Problem**: Log file is named by STARTING folder (often `Progetti`), but actual work happens in subfolders like `ai--CC-flight-deck`.

**Solution**: AI infers project from:
- File paths referenced in tool calls
- Folder names in Bash commands
- Context of conversation

**Multi-project rule**: Attribute to PRIMARY project (most time spent).

### 2.5 Session Content Structure

**Keep**:
- User commands only (truncate to 300 chars)
- AI-generated executive summary
- AI-generated achievements (or "no achievements")
- Lessons learned (optional - delete section if none)
- Metadata in **markdown tables** (not YAML frontmatter)

**Discard**:
- AI responses
- Tool results (file contents, bash output)
- System prompts, injected context
- Thinking/reasoning blocks

### 2.6 Data Format

> "Markdown table in the file. Just counts are enough."

**Output structure**:
```markdown
# Session: 2026-01-21 | ai--CC-flight-deck | 47 min

## Metrics

| Metric | Value |
|--------|-------|
| Date | 2026-01-21 |
| Start | 14:25 |
| End | 15:12 |
| Duration | 47 min |
| Active | 25 min |
| Project | ai--CC-flight-deck |

## Tools Used

| Category | Name | Count |
|----------|------|-------|
| Command | /plan | 3 |
| Command | /commit | 2 |
| Skill | communicator | 1 |
| Agent | Explore | 5 |
| Agent | Plan | 2 |
| MCP | notion | 4 |

## Executive Summary

[AI-generated 1-2 paragraphs about what was accomplished]

## Achievements

- [Past-tense accomplishment 1]
- [Past-tense accomplishment 2]
- OR: "No concrete achievements this session"

## Lessons Learned

[Optional - delete entire section if none]

---

## User Commands

- 14:25 - Help me build a markdown parser for term-diary files...
- 14:30 - The active percentage is wrong, check timezone handling...
[max 300 chars each]
```

### 2.7 Processing Behavior

**Trigger modes**:
- `/diary-CClogs --today` - Process today's logs
- `/diary-CClogs --all` - Process all unprocessed
- `/diary-CClogs <session-id>` - Process specific session

**Minimum threshold**: Skip sessions < 5 minutes

**Interactive approval**:
> "Show me a short summary and links to source/output. I say 'next' or 'suggest changes'."

For each file:
1. Show: project, duration, key metrics, 1-paragraph summary
2. Show: link to source JSONL, link to output .md
3. Wait for user: "next" or change request
4. If changes requested, reprocess with guidance

**Idempotency**: If same log processed twice → overwrite (latest wins)

---

## 3. TECHNICAL CONTEXT

### 3.1 File Locations

```
Source logs:
~/.claude/projects/{project-folder}/*.jsonl
  - UUID format: 12345678-1234-1234-1234-123456789012.jsonl
  - agent-*.jsonl are sub-sessions (skip these)

Output location:
~/Library/Mobile Documents/com~apple~CloudDocs/Progetti/_archive/CC Logs/
  - Filename: YYYY-MM-DD_project_XXmin_uuid8.md

Skill location (new):
~/.claude/skills/diary-CClogs/
  - SKILL.md - Skill definition
  - (other files as needed)
```

### 3.2 JSONL Structure

**User message entry**:
```json
{
  "type": "user",
  "timestamp": "2026-01-21T14:25:00.000Z",
  "message": {
    "role": "user",
    "content": "/plan help me build a feature"
  }
}
```

**Assistant message with tools**:
```json
{
  "type": "assistant",
  "timestamp": "2026-01-21T14:25:30.000Z",
  "message": {
    "id": "msg_123abc",
    "role": "assistant",
    "content": [
      {"type": "text", "text": "I'll help you..."},
      {"type": "tool_use", "name": "Task", "input": {"subagent_type": "Explore", "prompt": "..."}},
      {"type": "tool_use", "name": "mcp__notion__search", "input": {"query": "..."}},
      {"type": "tool_use", "name": "Skill", "input": {"skill": "commit"}}
    ]
  }
}
```

### 3.3 Dashboard Integration

> "Don't worry about dashboard data management. Focus only on session processing. My dashboard update routine will collect data from processed files."

**Implication**: Just produce good .md files with exposed metrics. Dashboard will parse them later.

---

## 4. DESIGN CONSTRAINTS

### 4.1 Python Limitations

> "Python produces wrong results and is hard for me to verify on long files."

**Guidelines**:
- Prefer Claude Code doing analysis over Python
- If Python used, only for simple, verifiable operations
- Consider: Python does file I/O, Claude does intelligence

### 4.2 Context Window Consideration

> "Claude can analyze logs, long is a LOT. We have margin."

- Claude Code has 200K token context
- Average JSONL log may be large but within limits
- If needed, preprocess to remove obvious noise (repeated tool results, etc.)

### 4.3 No File Size Optimization

> "I'm not aiming for very small file size."

- Don't over-optimize for file size
- Prioritize data quality and completeness
- 10-15% of original size is acceptable

---

## 5. ACCEPTANCE CRITERIA

### 5.1 Core Functionality
- [ ] New skill `/diary-CClogs` created and invocable
- [ ] Processes JSONL logs into structured markdown
- [ ] Three modes work: --today, --all, <session-id>
- [ ] Skips sessions < 5 minutes
- [ ] Interactive approval flow works

### 5.2 Tool Detection
- [ ] Commands detected (user messages starting with `/`)
- [ ] Skills detected (Skill tool calls)
- [ ] Agents detected (Task tool calls with subagent_type)
- [ ] MCPs detected (mcp__* tool calls)
- [ ] Unknown tools prompt user for categorization
- [ ] No hardcoded tool lists - dynamic discovery

### 5.3 Project Detection
- [ ] Infers actual project from file paths, not starting folder
- [ ] Multi-project sessions attributed to primary project

### 5.4 Content Quality
- [ ] Executive summary generated (not placeholder)
- [ ] Achievements list or "no achievements" marker
- [ ] Lessons learned section deleted if none
- [ ] User commands preserved (300 char limit)
- [ ] Metrics in markdown table format

### 5.5 Data Exposure
- [ ] All tracked tool counts in markdown table
- [ ] Dashboard can parse the output (table format)

---

## 6. RESOLVED QUESTIONS

1. **Unknown tool handling**: AI categorizes tools automatically. Only ask user if genuinely unsure. Categories: Command, Skill, Agent, MCP, Ignore.

2. **Project inference logic**: AI judgment from conversation context. No mechanical heuristics - trust AI to understand what project the session was primarily about.

## 7. REMAINING OPEN QUESTIONS FOR IMPLEMENTER

1. **Noise preprocessing**: Should there be a lightweight Python pass to strip obvious noise before Claude analyzes? Or can Claude handle raw JSONL?

2. **Error handling**: What if JSONL is malformed? What if context window exceeded?

---

## 8. FILES TO CREATE

| File | Purpose |
|------|---------|
| `~/.claude/skills/diary-CClogs/SKILL.md` | Skill definition and AI instructions |
| `~/.claude/skills/diary-CClogs/` (folder) | Skill home |

**Do NOT modify**: The broken `/term-diary` skill - leave it as-is for reference.

---

## 9. IMPLEMENTATION FIRST STEP

Copy this problem statement to:
`~/Progetti/ai--CC-flight-deck/DIARY_CCLOGS_PROBLEM_STATEMENT.md`

This serves as the canonical reference for the implementing AI.

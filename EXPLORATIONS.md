# Explorations

Investigations into tools, patterns, or approaches that were evaluated but **not adopted**. Kept here so future sessions don't re-investigate the same ground.

---

## RTK (Rust Token Killer)

**Date:** 2026-03-28
**Repo:** https://github.com/rtk-ai/rtk
**Verdict:** Not adopted — low ROI for this repo

### What it is

RTK is a Rust CLI proxy (~14.7K stars, v0.34.0) that sits between AI coding agents and shell commands, compressing Bash output before feeding it back to the LLM context window. It hooks into Claude Code via `PreToolUse`, rewriting Bash commands (e.g., `git status` -> `rtk git status`). Claims 60-90% token reduction through smart filtering, grouping, truncation, and deduplication.

### Why it was evaluated

We investigated whether RTK could meaningfully reduce token consumption in the ADLC pipeline.

### Why it was rejected

1. **Wrong bottleneck.** Read/Write/Edit tools account for ~70-80% of token growth. RTK only intercepts Bash command output.
2. **agent-browser dominance.** ~65% of Bash calls are `agent-browser` commands (our custom browser automation binary). RTK has no filter for it.
3. **Already self-truncated.** Build output is piped through `tail -N` patterns in agent code, pre-truncating before RTK could act.
4. **Tiny target.** Git-heavy agents (planner, architect) are the only RTK-compressible category and represent ~3% of total tokens.
5. **Windows issues.** Known stack overflow on startup (issue #855), no automated hook setup (`rtk init -g` falls back to degraded CLAUDE.md injection mode).
6. **Security concerns.** Shell injection via `sh -c` in `rtk err/test/summary` (issue #640), opt-out telemetry, full command strings stored in SQLite for 90 days.
7. **Estimated savings: ~4%** of total tokens (4-6M out of 128M) — doesn't justify setup and maintenance burden.

### Supporting data (from 30-step ADLC run)

| Agent type               | Steps | Tokens | % of total | Bash profile                                                          |
| ------------------------ | ----- | ------ | ---------- | --------------------------------------------------------------------- |
| Coders (Sonnet)          | 8     | ~96.5M | 75%        | 103 Bash calls in heaviest run; mostly agent-browser + pnpm with tail |
| Reviewers (Opus)         | 8     | ~24.5M | 19%        | Dominated by agent-browser                                            |
| Explorers (Sonnet)       | 5     | ~3.3M  | 3%         | 2 Bash calls each (generate-package-map + rm)                         |
| Planner/Architect/Others | mixed | ~7.1M  | 6%         | git/gh commands — the only RTK-compressible category                  |

You are in **planning mode**.

Your task is to design:

1. A `CLAUDE.md` file.
2. An agent-oriented documentation system based on **progressive disclosure**.

The primary goal of progressive disclosure is to avoid turning `CLAUDE.md` into a large, monolithic file. Instead:

- `CLAUDE.md` must act as a **lightweight index and entry point**.
- Detailed knowledge must live in `./agent-docs`.
- The documentation must be structured so that agents can progressively discover relevant context from `CLAUDE.md`.
- The whole system must be designed around progressive disclosure: agents pay only a very small tokens cost upfront, then load specific documents on-demand based on keyword matching from the index

---

## Core Principles

### 1. Agent Memory Location

- All agent-oriented documentation must be stored in `./agent-docs`.
- This folder represents the **Agent Memory** of the repository.
- Documents are written **by AI agents for AI agents**.
- They do not need to be optimized for human readability.
- They should prioritize clarity, structure, explicit assumptions, and machine discoverability.

---

### 2. Responsibilities of Each Layer

#### `CLAUDE.md`

- Acts as a structured index into `./agent-docs`.
- An index, not a knowledge base — it routes agents to the right file, nothing more
- Must remain concise.
- Must not duplicate detailed content from agent-docs.

Key rules for `CLAUDE.md`:

- One entry per file, never per section
- Keyword-rich summaries are the routing mechanism
- Never add a routing table — the index already embeds routing signal
- Keep under ~55 lines; to add a line, shorten or remove another

#### `./agent-docs`

Must include structured documentation about:

- **Project overview** — What the project is, repo structure, key concepts, how pieces fit together
- **Design patterns** — Cross-cutting patterns, end-to-end feature flows, non obvious conventions
- **References** — Development setup, commands, build tooling, CI/CD, release process
- **Quality** — Test framework, test patterns, what to validate before committing
- **Specifications** — Package APIs, key exports, source locations
- **Architectural decisions (ADR)** — Why significant design choices were made, options considered, consequences
- **Operational decisions (ODR)** — Why significant tooling/process choices were made, options considered, consequences

The content should be modular and discoverable.

---

### 3. Existing Structure

A boilerplate structure already exists in `./agent-docs`.

- Start from this structure.
- Evaluate whether it supports progressive disclosure.
- If needed, propose an improved structure.
- Explain why the alternative structure would be better for long-term growth and agent usability.

---

### 4. Context & Inspiration

You must draw inspiration from:

- [https://github.com/workleap/wl-squide](https://github.com/workleap/wl-squide)
  (An implementation of similar concepts, though not fully validated.)
- [https://openai.com/index/harness-engineering/](https://openai.com/index/harness-engineering/)
  Especially the section titled:
  **"We made repository knowledge the system of record"**

However:

- Do not copy structure blindly.
- Adapt concepts to this repository.

---

### 5. Current Repository State

Important constraints:

- The projects in this repository do not yet exist.
- Most libraries have not yet been added.
- The Agent Memory will initially contain minimal information.

Your objective is to:

- Define a strong foundation.
- Create structure, templates, and conventions.
- Make it easy to automatically augment the Agent Memory as the repository evolves.

---

### 6. ADR and ODR Rules

- Attempt to extract and propose initial ADRs and ODRs based on:
    - Current repository setup
    - Documentation strategy
    - Structural decisions

- Before adding any ADR or ODR record, validate it with me.
- Provide proposed records in draft form for review.

| ADR (Architecture)                 | ODR (Operational)               |
| ---------------------------------- | ------------------------------- |
| Framework design, module APIs      | Build tooling, test runners     |
| Consumer-facing behavior           | CI pipeline structure           |
| Breaking changes                   | Agent workflow conventions      |
| Security/auth approaches           | Development process conventions |
| Dependency choices that affect API | Caching strategies              |

---

Spawn up to 10 agents to assist and challenge you.

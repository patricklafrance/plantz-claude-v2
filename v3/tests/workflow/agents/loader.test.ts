import { describe, it, expect } from "vitest";

import { loadAgent, loadAllAgents } from "../../../src/workflow/agents.js";
import { resolveConfig } from "../../../src/config.js";

describe("loadAgent", () => {
    it("returns a valid definition for coder", () => {
        const { name, definition } = loadAgent("coder");

        expect(name).toBe("coder");
        expect(definition.description).toBe("Implement a single slice from the plan.");
        expect(definition.model).toBe("claude-opus-4-6");
        expect(definition.effort).toBe("medium");
        expect(definition.skills).toEqual([
            "node_modules/@patlaf/adlc/skills/scaffold-module/SKILL.md",
            "node_modules/@patlaf/adlc/skills/scaffold-storybook/SKILL.md",
            "node_modules/@patlaf/adlc/skills/browser-recovery/SKILL.md",
            "node_modules/@patlaf/adlc/skills/workleap-squide/SKILL.md",
            "node_modules/@patlaf/adlc/skills/agent-browser/SKILL.md"
        ]);
        expect(definition.prompt).toBeTruthy();
        expect(definition.prompt.length).toBeGreaterThan(0);
    });

    it("resolves sonnet alias to full model ID", () => {
        const { definition } = loadAgent("explorer");

        expect(definition.model).toBe("claude-sonnet-4-6");
    });

    it("parses tools field from frontmatter", () => {
        const { definition } = loadAgent("explorer");

        expect(definition.tools).toEqual(["Read", "Glob", "Grep", "Bash", "Write"]);
    });

    it("throws for an unknown agent name", () => {
        expect(() => loadAgent("nonexistent")).toThrow(/Unknown agent/);
    });
});

describe("loadAllAgents", () => {
    it("returns exactly 15 agents", () => {
        const agents = loadAllAgents();

        expect(Object.keys(agents)).toHaveLength(15);
    });

    it("every agent has a non-empty prompt, description, and model", () => {
        const agents = loadAllAgents();

        for (const [name, def] of Object.entries(agents)) {
            expect(def.prompt, `${name} should have a prompt`).toBeTruthy();
            expect(def.prompt.length, `${name} prompt should be non-empty`).toBeGreaterThan(0);
            expect(def.description, `${name} should have a description`).toBeTruthy();
            expect(def.model, `${name} should have a model`).toBeTruthy();
        }
    });

    it("includes all expected agent names", () => {
        const agents = loadAllAgents();
        const names = Object.keys(agents).sort();

        expect(names).toEqual([
            "challenge-arbiter",
            "coder",
            "cohesion-challenger",
            "document",
            "domain-mapper",
            "evidence-researcher",
            "explorer",
            "monitor",
            "placement-gate",
            "plan-gate",
            "planner",
            "pr",
            "reviewer",
            "simplify",
            "sprawl-challenger"
        ]);
    });

    it("prepends preamble to every agent's prompt when provided", () => {
        const preamble = "## Project context\n\nTest preamble";
        const agents = loadAllAgents(preamble);

        for (const [name, def] of Object.entries(agents)) {
            expect(def.prompt, `${name} should start with preamble`).toMatch(/^## Project context/);
            expect(def.prompt, `${name} should contain separator`).toContain("---");
        }
    });

    it("does not prepend preamble when omitted", () => {
        const agents = loadAllAgents();
        const coder = agents["coder"];

        expect(coder.prompt).toMatch(/^# Harness Coder/);
    });

    it("merges consumer skills from config into matching agents", () => {
        const cwd = "/repo";
        const config = resolveConfig({
            agents: {
                coder: { skills: ["accessibility"] },
                reviewer: { skills: ["custom-review"] }
            }
        });
        const agents = loadAllAgents(undefined, config, cwd);

        // Coder: bundled skills + resolved consumer skill
        expect(agents["coder"].skills).toEqual([
            "node_modules/@patlaf/adlc/skills/scaffold-module/SKILL.md",
            "node_modules/@patlaf/adlc/skills/scaffold-storybook/SKILL.md",
            "node_modules/@patlaf/adlc/skills/browser-recovery/SKILL.md",
            "node_modules/@patlaf/adlc/skills/workleap-squide/SKILL.md",
            "node_modules/@patlaf/adlc/skills/agent-browser/SKILL.md",
            "/repo/.claude/skills/accessibility/SKILL.md"
        ]);

        // Reviewer: bundled skills + resolved consumer skill
        expect(agents["reviewer"].skills).toEqual([
            "node_modules/@patlaf/adlc/skills/validate-modules/SKILL.md",
            "node_modules/@patlaf/adlc/skills/browser-recovery/SKILL.md",
            "node_modules/@patlaf/adlc/skills/agent-browser/SKILL.md",
            "/repo/.claude/skills/custom-review/SKILL.md"
        ]);
    });

    it("does not modify agents when config has no agent overrides", () => {
        const config = resolveConfig({});
        const agents = loadAllAgents(undefined, config, "/repo");

        expect(agents["coder"].skills).toEqual([
            "node_modules/@patlaf/adlc/skills/scaffold-module/SKILL.md",
            "node_modules/@patlaf/adlc/skills/scaffold-storybook/SKILL.md",
            "node_modules/@patlaf/adlc/skills/browser-recovery/SKILL.md",
            "node_modules/@patlaf/adlc/skills/workleap-squide/SKILL.md",
            "node_modules/@patlaf/adlc/skills/agent-browser/SKILL.md"
        ]);
    });
});

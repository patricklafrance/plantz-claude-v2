import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { query } from "@anthropic-ai/claude-agent-sdk";
import { parse } from "yaml";

import { resolveModel, type ResolvedConfig } from "../../config.js";

/** SDK-compatible agent definition. */
export type AgentDefinition = {
    description: string;
    tools?: string[];
    disallowedTools?: string[];
    prompt: string;
    model?: string;
    skills?: string[];
    maxTurns?: number;
    effort?: ("low" | "medium" | "high" | "max") | number;
    permissionMode?: "default" | "acceptEdits" | "bypassPermissions" | "plan" | "dontAsk" | "auto";
};

/** Frontmatter shape as parsed from YAML. */
interface AgentFrontmatter {
    name: string;
    description: string;
    model?: string;
    effort?: string | number;
    tools?: string[] | string;
    skills?: string[] | string;
    maxTurns?: number;
    disallowedTools?: string[] | string;
    permissionMode?: string;
}

/** Normalize a field that may be a comma-separated string or an array. */
function toStringArray(value: string[] | string | undefined): string[] | undefined {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    return value
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
}

const AGENTS_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * Parse a `.md` file with YAML frontmatter into an agent name + definition.
 */
function parseAgentFile(filePath: string): { name: string; definition: AgentDefinition } {
    const raw = readFileSync(filePath, "utf-8");

    // Split on the frontmatter fences (leading `---` and closing `---`).
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) {
        throw new Error(`Invalid agent file (missing frontmatter): ${filePath}`);
    }

    const frontmatter = parse(match[1]) as AgentFrontmatter;
    const prompt = match[2].trim();

    if (!frontmatter.name) {
        throw new Error(`Agent file missing 'name' in frontmatter: ${filePath}`);
    }
    if (!frontmatter.description) {
        throw new Error(`Agent file missing 'description' in frontmatter: ${filePath}`);
    }

    const definition: AgentDefinition = {
        description: frontmatter.description,
        prompt,
        model: resolveModel(frontmatter.model)
    };

    if (frontmatter.effort !== undefined) definition.effort = frontmatter.effort as AgentDefinition["effort"];
    const tools = toStringArray(frontmatter.tools);
    if (tools) definition.tools = tools;
    const skills = toStringArray(frontmatter.skills);
    if (skills) definition.skills = skills;
    if (frontmatter.maxTurns !== undefined) definition.maxTurns = frontmatter.maxTurns;
    const disallowedTools = toStringArray(frontmatter.disallowedTools);
    if (disallowedTools) definition.disallowedTools = disallowedTools;
    if (frontmatter.permissionMode) definition.permissionMode = frontmatter.permissionMode as AgentDefinition["permissionMode"];

    return { name: frontmatter.name, definition };
}

/**
 * Load a single agent definition by name.
 *
 * @throws if the file does not exist or has invalid frontmatter.
 */
export function loadAgent(name: string): { name: string; definition: AgentDefinition } {
    const filePath = join(AGENTS_DIR, `${name}.md`);

    try {
        return parseAgentFile(filePath);
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            throw new Error(`Unknown agent: "${name}" (file not found: ${filePath})`);
        }
        throw err;
    }
}

/** Resolve a skill name to a `.claude/skills/{name}/SKILL.md` path relative to `cwd`. */
function resolveSkillName(name: string, cwd: string): string {
    return [cwd, ".claude", "skills", name, "SKILL.md"].join("/");
}

/**
 * Load all agent definitions from the agents directory.
 *
 * @param preamble - Optional project context preamble to prepend to every agent's prompt.
 * @param config - Optional resolved config; consumer-defined skills are merged into agent definitions.
 * @param cwd - Target repository root; used to resolve consumer skill names to paths.
 * @returns a record keyed by agent name.
 */
export function loadAllAgents(preamble?: string, config?: ResolvedConfig, cwd?: string): Record<string, AgentDefinition> {
    const files = readdirSync(AGENTS_DIR).filter(f => f.endsWith(".md"));
    const agents: Record<string, AgentDefinition> = {};
    const agentOverrides = config?.agents ?? {};

    for (const file of files) {
        const { name, definition } = parseAgentFile(join(AGENTS_DIR, file));

        if (preamble) {
            definition.prompt = `${preamble}\n\n---\n\n${definition.prompt}`;
        }

        const extra = agentOverrides[name]?.skills;
        if (extra?.length && cwd) {
            const resolved = extra.map(s => resolveSkillName(s, cwd));
            definition.skills = [...(definition.skills ?? []), ...resolved];
        }

        agents[name] = definition;
    }

    return agents;
}

/** Run a single agent to completion via the SDK. */
export async function runAgent(agentName: string, prompt: string, cwd: string, agents: Record<string, AgentDefinition>): Promise<string> {
    const conversation = query({
        prompt,
        options: {
            agent: agentName,
            agents,
            cwd,
            settingSources: ["project"],
            permissionMode: "bypassPermissions",
            allowDangerouslySkipPermissions: true,
            persistSession: false
        }
    });

    let result = "";
    for await (const message of conversation) {
        if (message.type === "result" && message.subtype === "success") {
            result = message.result;
        }
    }
    return result;
}

/**
 * Project context preamble — assembled at the start of every run()
 * and injected into every agent and skill prompt.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import type { ResolvedConfig } from "./config.js";

// ── Types ────────────────────────────────────────────────

export interface ProjectContext {
    commands: Record<string, string>;
    referenceDocs: Record<string, string>;
    structure: {
        apps: string;
        hostApp: string;
        modules: string;
        packages: string;
        license: string;
        author?: string;
    };
}

// ── Required scripts (same list as preflight validates) ──

const REQUIRED_SCRIPTS = [
    "build",
    "lint",
    "test",
    "typecheck",
    "oxlint",
    "oxlint-auto-fix",
    "oxfmt",
    "oxfmt-auto-fix",
    "dev-host",
    "dev-storybook"
] as const;

// ── Reference doc key mapping ────────────────────────────

/** Expected reference doc categories and filename heuristics. */
const REF_DOC_HEURISTICS: Record<string, RegExp> = {
    architecture: /architect/i,
    decisions: /\badr\b|decision/i,
    operations: /\bodr\b|operat/i,
    placement: /placement/i,
    "data-layer": /data|msw|tanstack|query/i,
    components: /storybook|component/i,
    styling: /tailwind|css|style|postcss/i,
    browser: /browser/i,
    design: /design|ui-ux/i
};

/**
 * Scan a reference directory and classify files by heuristic matching.
 * Falls back to filename-based classification (no agent call needed for the common case).
 */
function classifyReferenceDocs(refDir: string, cwd: string): Record<string, string> {
    const docs: Record<string, string> = {};

    if (!existsSync(refDir)) {
        return docs;
    }

    const files = collectMarkdownFiles(refDir);

    for (const absPath of files) {
        const relPath = relative(cwd, absPath).replace(/\\/g, "/");
        const filename = absPath.replace(/\\/g, "/");

        for (const [key, pattern] of Object.entries(REF_DOC_HEURISTICS)) {
            if (pattern.test(filename) && !docs[key]) {
                docs[key] = relPath;
                break;
            }
        }
    }

    return docs;
}

/** Recursively collect all .md files under a directory. */
function collectMarkdownFiles(dir: string): string[] {
    const results: string[] = [];

    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        return results;
    }

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory() && entry.name !== "node_modules") {
            results.push(...collectMarkdownFiles(fullPath));
        } else if (entry.name.endsWith(".md")) {
            results.push(fullPath);
        }
    }

    return results;
}

// ── Public API ───────────────────────────────────────────

/**
 * Assemble the full project context from three sources:
 * 1. Standardized scripts from root package.json
 * 2. Reference doc mappings from the reference directory
 * 3. Structure and scaffolding values from resolved config
 */
export function buildProjectContext(cwd: string, config: ResolvedConfig): ProjectContext {
    // 1. Commands — only the standardized scripts
    const commands: Record<string, string> = {};
    let scripts: Record<string, string> = {};

    try {
        const pkgPath = join(cwd, "package.json");
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { scripts?: Record<string, string> };
        scripts = pkg.scripts ?? {};
    } catch {
        // No package.json or unreadable — commands will be empty
    }

    for (const name of REQUIRED_SCRIPTS) {
        if (scripts[name]) {
            commands[name] = `pnpm ${name}`;
        }
    }

    // 2. Reference docs
    const refDir = join(cwd, config.structure.reference);
    const referenceDocs = classifyReferenceDocs(refDir, cwd);

    // 3. Structure
    const hostAppPath = `${config.structure.apps}/${config.structure.hostApp}`.replace(/^\.\//, "");

    return {
        commands,
        referenceDocs,
        structure: {
            apps: config.structure.apps,
            hostApp: hostAppPath,
            modules: config.structure.modules,
            packages: config.structure.packages,
            license: config.scaffolding.packageMeta.license,
            author: config.scaffolding.packageMeta.author
        }
    };
}

/** Format a ProjectContext as a markdown preamble for prompt injection. */
export function contextToPreamble(ctx: ProjectContext): string {
    const lines: string[] = ["## Project context", ""];

    // Commands section
    const commandEntries = Object.entries(ctx.commands);

    if (commandEntries.length > 0) {
        lines.push("### Commands", "");

        for (const [name, cmd] of commandEntries) {
            lines.push(`- ${name}: \`${cmd}\``);
        }

        lines.push("");
    }

    // Reference docs section
    const refEntries = Object.entries(ctx.referenceDocs);

    if (refEntries.length > 0) {
        lines.push("### Reference docs", "");

        for (const [key, path] of refEntries) {
            lines.push(`- ${key}: ${path}`);
        }

        lines.push("");
    }

    // Structure section
    lines.push("### Structure", "");
    lines.push(`- Apps: ${ctx.structure.apps}`);
    lines.push(`- Host app: ${ctx.structure.hostApp}`);
    lines.push(`- Modules: ${ctx.structure.modules}`);
    lines.push(`- Packages: ${ctx.structure.packages}`);
    lines.push(`- License: ${ctx.structure.license}`);

    if (ctx.structure.author) {
        lines.push(`- Author: ${ctx.structure.author}`);
    }

    return lines.join("\n");
}

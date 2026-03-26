#!/usr/bin/env node

/**
 * generate-package-map.mjs
 *
 * Reads `.adlc/current-slice.md`, parses the Reference Packages section,
 * resolves package names to filesystem paths, globs source files, and writes
 * `.adlc/current-package-map.md` with a file tree + highlighted files per package.
 *
 * Usage: node .claude/hooks/src/generate-package-map.mjs
 *
 * Produces `.adlc/current-package-map.md` — consumed by the Explore agent to
 * selectively read key files instead of scanning entire packages.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const cwd = process.cwd();
const ADLC_DIR = resolve(cwd, ".adlc");
const SLICE_PATH = resolve(ADLC_DIR, "current-slice.md");
const OUTPUT_PATH = resolve(ADLC_DIR, "current-package-map.md");

// ── 1. Read and parse slice ────────────────────────────────

if (!existsSync(SLICE_PATH)) {
    // No current slice — nothing to do.
    process.exit(0);
}

const sliceContent = readFileSync(SLICE_PATH, "utf8");

const refSection = extractSection(sliceContent, "Reference Packages");

if (!refSection) {
    // Slice has no Reference Packages section — skip.
    process.exit(0);
}

const references = parseReferences(refSection);

if (references.length === 0) {
    process.exit(0);
}

// ── 2. Build workspace name → path mapping ─────────────────

const nameToPath = buildWorkspaceMap(cwd);

// ── 3. Generate map for each reference package ─────────────

const sections = [];

for (const ref of references) {
    const pkgPath = nameToPath.get(ref.name);

    if (!pkgPath) {
        sections.push(`## ${ref.name} → (not found in workspace)\n`);
        continue;
    }

    const relPath = relative(cwd, pkgPath).replace(/\\/g, "/");
    const srcDir = resolve(pkgPath, "src");
    const sourceFiles = existsSync(srcDir) ? globSourceFiles(srcDir, pkgPath) : [];

    let section = `## ${ref.name} → ${relPath}\n\n`;

    section += "### Source Files\n\n";
    if (sourceFiles.length === 0) {
        section += "_(no source files found)_\n";
    } else {
        for (const f of sourceFiles) {
            section += `- ${f}\n`;
        }
    }

    section += "\n### Highlighted Files (from planner)\n\n";
    section += `${ref.description}\n`;

    sections.push(section);
}

// ── 4. Write output ────────────────────────────────────────

const output = `# Package Map\n\nGenerated from \`.adlc/current-slice.md\` reference packages.\n\n${sections.join("\n")}`;

mkdirSync(ADLC_DIR, { recursive: true });
writeFileSync(OUTPUT_PATH, output);

// ── Helpers ────────────────────────────────────────────────

/**
 * Extract the content of a ## section from markdown.
 * Returns the text between the header and the next ## or end of file.
 */
function extractSection(markdown, heading) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^## ${escaped}\\s*$`, "m");
    const match = markdown.match(re);

    if (!match) {
        return null;
    }

    const start = match.index + match[0].length;
    const nextSection = markdown.indexOf("\n## ", start);
    const end = nextSection === -1 ? markdown.length : nextSection;

    return markdown.slice(start, end).trim();
}

/**
 * Parse reference package lines from the section content.
 *
 * Each line: - `@packages/core-plants` — description with `highlighted files`
 */
function parseReferences(section) {
    const lines = section.split("\n").filter(l => l.trim().startsWith("- "));
    const refs = [];

    for (const line of lines) {
        // Match: - `@scope/name` — description
        const m = line.match(/^-\s+`([^`]+)`\s*[—–-]+\s*(.+)$/);

        if (m) {
            refs.push({ name: m[1].trim(), description: m[2].trim() });
        }
    }

    return refs;
}

/**
 * Scan workspace for all package.json files and build a name → absolute path map.
 */
function buildWorkspaceMap(root) {
    const map = new Map();
    const dirs = ["apps", "packages"];

    for (const dir of dirs) {
        const base = resolve(root, dir);

        if (!existsSync(base)) {
            continue;
        }

        walkForPackageJson(base, map);
    }

    return map;
}

/**
 * Recursively walk directories looking for package.json files.
 * Skips node_modules and .turbo directories.
 */
function walkForPackageJson(dir, map) {
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        return;
    }

    for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === ".turbo") {
            continue;
        }

        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
            walkForPackageJson(fullPath, map);
        } else if (entry.name === "package.json") {
            try {
                const pkg = JSON.parse(readFileSync(fullPath, "utf8"));

                if (pkg.name) {
                    map.set(pkg.name, dir);
                }
            } catch {
                // Skip malformed package.json
            }
        }
    }
}

/**
 * Recursively glob for .ts/.tsx files under a directory.
 * Returns paths relative to pkgRoot prefixed with "src/".
 */
function globSourceFiles(dir, pkgRoot) {
    const results = [];

    function walk(current) {
        let entries;
        try {
            entries = readdirSync(current, { withFileTypes: true });
        } catch {
            return;
        }

        for (const entry of entries) {
            if (entry.name === "node_modules" || entry.name === ".turbo") {
                continue;
            }

            const fullPath = join(current, entry.name);

            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (/\.(ts|tsx)$/.test(entry.name)) {
                results.push(relative(pkgRoot, fullPath).replace(/\\/g, "/"));
            }
        }
    }

    walk(dir);
    results.sort();

    return results;
}

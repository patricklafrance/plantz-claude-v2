import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, afterEach } from "vitest";

import { buildProjectContext, contextToPreamble } from "../src/context.js";
import { resolveConfig } from "../src/config.js";

describe("buildProjectContext", () => {
    const tmpBase = join(tmpdir(), "adlc-context-test");
    const dirs: string[] = [];

    function makeTmpDir(): string {
        const dir = join(tmpBase, `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
        mkdirSync(dir, { recursive: true });
        dirs.push(dir);
        return dir;
    }

    afterEach(() => {
        for (const dir of dirs) {
            if (existsSync(dir)) {
                rmSync(dir, { recursive: true, force: true });
            }
        }
        dirs.length = 0;
    });

    it("includes commands from package.json scripts", () => {
        const dir = makeTmpDir();
        writeFileSync(
            join(dir, "package.json"),
            JSON.stringify({ scripts: { build: "turbo build", lint: "oxlint .", test: "vitest" } })
        );

        const config = resolveConfig({});
        const ctx = buildProjectContext(dir, config);

        expect(ctx.commands.build).toBe("pnpm build");
        expect(ctx.commands.lint).toBe("pnpm lint");
        expect(ctx.commands.test).toBe("pnpm test");
    });

    it("only includes standardized scripts, not arbitrary ones", () => {
        const dir = makeTmpDir();
        writeFileSync(
            join(dir, "package.json"),
            JSON.stringify({ scripts: { build: "turbo build", "my-custom": "echo hi" } })
        );

        const config = resolveConfig({});
        const ctx = buildProjectContext(dir, config);

        expect(ctx.commands.build).toBe("pnpm build");
        expect(ctx.commands["my-custom"]).toBeUndefined();
    });

    it("classifies reference docs by filename heuristics", () => {
        const dir = makeTmpDir();
        const refDir = join(dir, "agent-docs");
        const refsDir = join(refDir, "references");
        mkdirSync(refsDir, { recursive: true });

        writeFileSync(join(refDir, "ARCHITECTURE.md"), "# Architecture");
        writeFileSync(join(refsDir, "placement.md"), "# Placement");
        writeFileSync(join(refsDir, "msw-tanstack-query.md"), "# Data");
        writeFileSync(join(refsDir, "storybook.md"), "# Storybook");
        writeFileSync(join(dir, "package.json"), JSON.stringify({ scripts: {} }));

        const config = resolveConfig({});
        const ctx = buildProjectContext(dir, config);

        expect(ctx.referenceDocs.architecture).toContain("ARCHITECTURE.md");
        expect(ctx.referenceDocs.placement).toContain("placement.md");
        expect(ctx.referenceDocs["data-layer"]).toContain("msw-tanstack-query.md");
        expect(ctx.referenceDocs.components).toContain("storybook.md");
    });

    it("returns empty referenceDocs when reference dir missing", () => {
        const dir = makeTmpDir();
        writeFileSync(join(dir, "package.json"), JSON.stringify({ scripts: {} }));

        const config = resolveConfig({});
        const ctx = buildProjectContext(dir, config);

        expect(ctx.referenceDocs).toEqual({});
    });

    it("reflects config overrides in structure", () => {
        const dir = makeTmpDir();
        writeFileSync(join(dir, "package.json"), JSON.stringify({ scripts: {} }));

        const config = resolveConfig({
            structure: { apps: "./applications", hostApp: "web" },
            scaffolding: { packageMeta: { license: "MIT", author: "Test Author" } }
        });
        const ctx = buildProjectContext(dir, config);

        expect(ctx.structure.apps).toBe("./applications");
        expect(ctx.structure.hostApp).toBe("applications/web");
        expect(ctx.structure.license).toBe("MIT");
        expect(ctx.structure.author).toBe("Test Author");
    });
});

describe("contextToPreamble", () => {
    it("formats commands, reference docs, and structure as markdown", () => {
        const preamble = contextToPreamble({
            commands: { build: "pnpm build", test: "pnpm test" },
            referenceDocs: { architecture: "agent-docs/ARCHITECTURE.md" },
            structure: {
                apps: "./apps",
                hostApp: "apps/host",
                modules: "./modules",
                packages: "./packages",
                license: "Apache-2.0"
            }
        });

        expect(preamble).toContain("## Project context");
        expect(preamble).toContain("### Commands");
        expect(preamble).toContain("- build: `pnpm build`");
        expect(preamble).toContain("- test: `pnpm test`");
        expect(preamble).toContain("### Reference docs");
        expect(preamble).toContain("- architecture: agent-docs/ARCHITECTURE.md");
        expect(preamble).toContain("### Structure");
        expect(preamble).toContain("- Apps: ./apps");
        expect(preamble).toContain("- License: Apache-2.0");
    });

    it("omits commands section when empty", () => {
        const preamble = contextToPreamble({
            commands: {},
            referenceDocs: {},
            structure: {
                apps: "./apps",
                hostApp: "apps/host",
                modules: "./modules",
                packages: "./packages",
                license: "Apache-2.0"
            }
        });

        expect(preamble).not.toContain("### Commands");
    });

    it("includes author when present", () => {
        const preamble = contextToPreamble({
            commands: {},
            referenceDocs: {},
            structure: {
                apps: "./apps",
                hostApp: "apps/host",
                modules: "./modules",
                packages: "./packages",
                license: "Apache-2.0",
                author: "Patrick Lafrance"
            }
        });

        expect(preamble).toContain("- Author: Patrick Lafrance");
    });
});

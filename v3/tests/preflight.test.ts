import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, afterEach } from "vitest";

import { validateRepository } from "../src/preflight.js";

describe("validateRepository", () => {
    const tmpBase = join(tmpdir(), "adlc-preflight-test");
    const dirs: string[] = [];

    function makeTmpDir(): string {
        const dir = join(tmpBase, `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
        mkdirSync(dir, { recursive: true });
        dirs.push(dir);
        return dir;
    }

    const validPkg = {
        scripts: {
            build: "turbo build",
            lint: "oxlint .",
            test: "vitest run",
            typecheck: "tsc --noEmit",
            oxlint: "oxlint .",
            "oxlint-auto-fix": "oxlint --fix .",
            oxfmt: "oxfmt --check .",
            "oxfmt-auto-fix": "oxfmt --write .",
            "dev-host": "turbo dev --filter=@apps/host",
            "dev-storybook": "turbo dev --filter=@apps/storybook"
        },
        devDependencies: {
            oxlint: "^0.1.0",
            oxfmt: "^0.1.0",
            "agent-browser": "^0.1.0"
        }
    };

    afterEach(() => {
        for (const dir of dirs) {
            if (existsSync(dir)) {
                rmSync(dir, { recursive: true, force: true });
            }
        }
        dirs.length = 0;
    });

    it("passes for a well-configured repo", () => {
        const dir = makeTmpDir();
        writeFileSync(join(dir, "package.json"), JSON.stringify(validPkg));

        expect(() => validateRepository(dir)).not.toThrow();
    });

    it("throws for missing script", () => {
        const dir = makeTmpDir();
        const pkg = { ...validPkg, scripts: { ...validPkg.scripts } };
        delete (pkg.scripts as Record<string, string>)["oxfmt-auto-fix"];
        writeFileSync(join(dir, "package.json"), JSON.stringify(pkg));

        expect(() => validateRepository(dir)).toThrow(/Missing script `oxfmt-auto-fix`/);
    });

    it("throws for missing devDependency", () => {
        const dir = makeTmpDir();
        const pkg = { ...validPkg, devDependencies: { ...validPkg.devDependencies } };
        delete (pkg.devDependencies as Record<string, string>)["agent-browser"];
        writeFileSync(join(dir, "package.json"), JSON.stringify(pkg));

        expect(() => validateRepository(dir)).toThrow(/Missing devDependency `agent-browser`/);
    });

    it("throws when package.json is missing", () => {
        const dir = makeTmpDir();

        expect(() => validateRepository(dir)).toThrow(/Cannot read/);
    });

    it("error message lists all required scripts", () => {
        const dir = makeTmpDir();
        const pkg = { scripts: {}, devDependencies: validPkg.devDependencies };
        writeFileSync(join(dir, "package.json"), JSON.stringify(pkg));

        expect(() => validateRepository(dir)).toThrow(/build, lint, test, typecheck/);
    });
});

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { describe, expect, it, afterEach } from "vitest";

describe("adlc init", () => {
    const tmpBase = join(tmpdir(), "adlc-cli-test");
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

    it("creates adlc.config.ts when it does not exist", () => {
        const dir = makeTmpDir();
        // Run cli.ts directly with tsx
        const cliPath = join(__dirname, "../src/cli.ts").replace(/\\/g, "/");
        execSync(`pnpm exec tsx ${cliPath} init`, { cwd: dir, stdio: "pipe" });

        const configPath = join(dir, "adlc.config.ts");
        expect(existsSync(configPath)).toBe(true);

        const content = readFileSync(configPath, "utf-8");
        expect(content).toContain("defineConfig");
        expect(content).toContain("@patlaf/adlc");
    });

    it("does not overwrite existing adlc.config.ts", () => {
        const dir = makeTmpDir();
        const configPath = join(dir, "adlc.config.ts");
        writeFileSync(configPath, "// existing config\n");

        const cliPath = join(__dirname, "../src/cli.ts").replace(/\\/g, "/");
        execSync(`pnpm exec tsx ${cliPath} init`, { cwd: dir, stdio: "pipe" });

        const content = readFileSync(configPath, "utf-8");
        expect(content).toBe("// existing config\n");
    });
});

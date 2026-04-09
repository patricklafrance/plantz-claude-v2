import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { mergeWorktree } from "../../../../../src/workflow/steps/slices/worktree/merger.js";

function git(cmd: string, cwd: string): string {
    return execSync(`git ${cmd}`, { cwd, encoding: "utf-8" });
}

describe("worktree/merger", () => {
    let repoDir: string;

    beforeEach(() => {
        repoDir = mkdtempSync(join(tmpdir(), "merger-test-"));

        git("init", repoDir);
        git("config user.email test@test.com", repoDir);
        git("config user.name Test", repoDir);

        writeFileSync(join(repoDir, "file.txt"), "initial");
        git("add .", repoDir);
        git('commit -m "initial"', repoDir);
    });

    afterEach(() => {
        rmSync(repoDir, { recursive: true, force: true });
    });

    it("succeeds for a clean merge", () => {
        git("checkout -b adlc/slice-1", repoDir);
        writeFileSync(join(repoDir, "feature.txt"), "feature content");
        git("add .", repoDir);
        git('commit -m "add feature"', repoDir);
        git("checkout main", repoDir);

        const result = mergeWorktree("adlc/slice-1", "main", repoDir);

        expect(result.success).toBe(true);
        expect(result.conflictFiles).toBeUndefined();

        const log = git("log --oneline -3", repoDir);
        expect(log).toContain("adlc/slice-1");
    });

    it("returns conflict files when merge conflicts", () => {
        git("checkout -b adlc/slice-conflict", repoDir);
        writeFileSync(join(repoDir, "file.txt"), "branch content");
        git("add .", repoDir);
        git('commit -m "branch change"', repoDir);

        git("checkout main", repoDir);
        writeFileSync(join(repoDir, "file.txt"), "main content");
        git("add .", repoDir);
        git('commit -m "main change"', repoDir);

        const result = mergeWorktree("adlc/slice-conflict", "main", repoDir);

        expect(result.success).toBe(false);
        expect(result.conflictFiles).toBeDefined();
        expect(result.conflictFiles).toContain("file.txt");

        const status = git("status --porcelain", repoDir).trim();
        expect(status).toBe("");
    });
});

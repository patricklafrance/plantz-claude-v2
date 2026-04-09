import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { collectResults } from "../../../../../src/workflow/steps/slices/worktree/collector.js";

describe("worktree/collector", () => {
    let worktreePath: string;
    let mainAdlcPath: string;

    beforeEach(() => {
        worktreePath = mkdtempSync(join(tmpdir(), "collector-wt-"));
        mainAdlcPath = mkdtempSync(join(tmpdir(), "collector-main-"));

        const adlcRoot = join(worktreePath, ".adlc");
        mkdirSync(join(adlcRoot, "implementation-notes"), { recursive: true });
        mkdirSync(join(adlcRoot, "verification-results"), { recursive: true });

        writeFileSync(join(adlcRoot, "implementation-notes", "slice-1.md"), "Impl notes for slice 1");
        writeFileSync(join(adlcRoot, "verification-results", "slice-1.md"), "Verification passed");
    });

    afterEach(() => {
        rmSync(worktreePath, { recursive: true, force: true });
        rmSync(mainAdlcPath, { recursive: true, force: true });
    });

    it("copies implementation-notes to the main .adlc/", async () => {
        await collectResults(worktreePath, mainAdlcPath);

        const dest = join(mainAdlcPath, "implementation-notes", "slice-1.md");
        expect(existsSync(dest)).toBe(true);
        expect(readFileSync(dest, "utf-8")).toBe("Impl notes for slice 1");
    });

    it("copies verification-results to the main .adlc/", async () => {
        await collectResults(worktreePath, mainAdlcPath);

        const dest = join(mainAdlcPath, "verification-results", "slice-1.md");
        expect(existsSync(dest)).toBe(true);
        expect(readFileSync(dest, "utf-8")).toBe("Verification passed");
    });

    it("handles missing source directories gracefully", async () => {
        const emptyWt = mkdtempSync(join(tmpdir(), "collector-empty-"));

        await collectResults(emptyWt, mainAdlcPath);

        expect(existsSync(join(mainAdlcPath, "implementation-notes"))).toBe(false);

        rmSync(emptyWt, { recursive: true, force: true });
    });
});

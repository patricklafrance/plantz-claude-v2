/** Step 3: DAG-aware wave execution with parallel slices. */

import { execSync } from "node:child_process";
import { exec } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

import type { OrchestratorOptions } from "../../orchestrator.js";
import { allocatePorts } from "../../../ports.js";
import type { Progress } from "../../../progress.js";
import { collectResults } from "./worktree/collector.js";
import { createWorktree, removeWorktree } from "./worktree/lifecycle.js";
import { mergeWorktree } from "./worktree/merger.js";
import { seedAdlc } from "./worktree/seeder.js";
import { buildDAG } from "./dag/scheduler.js";
import { runSlicePipeline } from "./revision-loop.js";

const execAsync = promisify(exec);

export async function runSlices(cwd: string, options: OrchestratorOptions, progress?: Progress): Promise<void> {
    const dag = buildDAG(resolve(cwd, ".adlc/slices"));

    if (options.dryRun) {
        for (const wave of dag.waves) {
            const names = wave.slices.map(s => s.name).join(", ");
            progress?.log(`wave-${wave.index}`, `${wave.slices.length} slice(s): ${names}`);
        }
        return;
    }

    const featureBranch = execSync("git branch --show-current", { cwd, encoding: "utf8" }).trim();

    for (const wave of dag.waves) {
        progress?.wave(wave.index, wave.slices.length, wave.slices.length);

        // Create worktrees
        const worktrees = wave.slices.map(slice => createWorktree(slice.name, featureBranch, cwd));

        // Seed .adlc/ in each worktree
        await Promise.all(
            worktrees.map((wt, i) =>
                seedAdlc(wt.path, {
                    planHeaderPath: resolve(cwd, ".adlc/plan-header.md"),
                    domainMappingPath: resolve(cwd, ".adlc/domain-mapping.md"),
                    slicesDir: resolve(cwd, ".adlc/slices"),
                    sliceFilename: wave.slices[i].filename,
                    priorImplementationNotes: getCompletedNotes(cwd)
                })
            )
        );

        // Install deps in each worktree
        await Promise.all(worktrees.map(wt => execAsync("pnpm install", { cwd: wt.path })));

        // Run slices in parallel
        const ports = worktrees.map((_, i) => allocatePorts(i));
        const results = await Promise.allSettled(
            worktrees.map((wt, i) => {
                progress?.slice(wave.slices[i].name, "pipeline", "starting");
                return runSlicePipeline(wave.slices[i].name, wt.path, ports[i], progress);
            })
        );

        // Merge and collect
        for (let i = 0; i < worktrees.length; i++) {
            const result = results[i];
            if (result.status === "fulfilled" && result.value.success) {
                progress?.slice(wave.slices[i].name, "merge", "merging to feature branch");
                mergeWorktree(worktrees[i].branch, featureBranch, cwd);
                await collectResults(worktrees[i].path, resolve(cwd, ".adlc"));
            } else {
                const reason = result.status === "fulfilled" ? result.value.reason : String((result as PromiseRejectedResult).reason);
                progress?.slice(wave.slices[i].name, "merge", `skipped: ${reason}`);
            }
            removeWorktree(worktrees[i].path, cwd);
        }
    }
}

/** Collect paths to all completed implementation notes from prior waves. */
function getCompletedNotes(cwd: string): string[] {
    const notesDir = resolve(cwd, ".adlc/implementation-notes");
    try {
        return readdirSync(notesDir)
            .filter(f => f.endsWith(".md"))
            .map(f => join(notesDir, f));
    } catch {
        return [];
    }
}

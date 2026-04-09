import { execSync } from "node:child_process";

export interface MergeResult {
    success: boolean;
    conflictFiles?: string[];
}

/** Merge a worktree branch back to the target branch using --no-ff. */
export function mergeWorktree(worktreeBranch: string, targetBranch: string, cwd: string): MergeResult {
    // Switch to the target branch
    execSync(`git checkout "${targetBranch}"`, { cwd });

    try {
        execSync(`git merge --no-ff "${worktreeBranch}"`, { cwd });

        return { success: true };
    } catch {
        // Merge failed — collect conflicting file names
        const output = execSync("git diff --name-only --diff-filter=U", {
            cwd,
            encoding: "utf-8"
        });

        const conflictFiles = output
            .split("\n")
            .map(line => line.trim())
            .filter(Boolean);

        // Abort the merge so the repo is left clean
        execSync("git merge --abort", { cwd });

        return { success: false, conflictFiles };
    }
}

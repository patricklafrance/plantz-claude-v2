import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Copy implementation-notes and verification-results from a worktree's .adlc/ back to the main .adlc/. */
export async function collectResults(worktreePath: string, mainAdlcPath: string): Promise<void> {
    const dirs = ["implementation-notes", "verification-results"] as const;

    for (const dir of dirs) {
        const srcDir = join(worktreePath, ".adlc", dir);
        const destDir = join(mainAdlcPath, dir);

        if (!existsSync(srcDir)) {
            continue;
        }

        mkdirSync(destDir, { recursive: true });

        const files = readdirSync(srcDir);
        for (const file of files) {
            copyFileSync(join(srcDir, file), join(destDir, file));
        }
    }
}

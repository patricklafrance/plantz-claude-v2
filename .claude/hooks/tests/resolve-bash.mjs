import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Resolve the path to a bash executable.
 * On Unix / Git Bash, "bash" is on PATH.
 * On Windows (PowerShell / CMD), Git's bash may not be on PATH —
 * fall back to common Git for Windows install locations.
 *
 * @returns {{ path: string } | null}
 */
function resolve() {
    // 1. Try PATH
    try {
        execFileSync("bash", ["--version"], { encoding: "utf8", timeout: 5_000, stdio: "pipe" });
        return { path: "bash" };
    } catch {
        // not on PATH
    }

    // 2. Windows: check Git for Windows locations
    if (process.platform === "win32") {
        const roots = [
            process.env.PROGRAMFILES,
            process.env["PROGRAMFILES(X86)"],
            process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Programs")
        ].filter(Boolean);

        for (const root of roots) {
            const candidate = join(root, "Git", "bin", "bash.exe");
            if (existsSync(candidate)) {
                return { path: candidate };
            }
        }
    }

    return null;
}

const resolved = resolve();

/** Absolute path (or "bash") to a working bash, or null if unavailable. */
export const bashPath = resolved?.path ?? null;

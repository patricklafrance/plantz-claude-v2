import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOOK_DIR = resolve(__dirname, "../../src/supervisor");

function pipeToHook(input) {
    return execFileSync(process.execPath, [resolve(HOOK_DIR, "subagent-stop.mjs")], {
        input: JSON.stringify(input),
        encoding: "utf8",
        cwd: input.cwd
    });
}

describe("supervisor subagent-stop", () => {
    let tmp;

    afterEach(() => {
        if (tmp) {
            rmSync(tmp, { recursive: true, force: true });
        }
    });

    it("clears supervisor state, events, recovery artifacts, and run-scoped install overrides", () => {
        tmp = mkdtempSync(join(tmpdir(), "supervisor-stop-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });

        writeFileSync(join(tmp, ".adlc", "supervisor-state.json"), "{}\n");
        writeFileSync(join(tmp, ".adlc", "supervisor-events.jsonl"), "{}\n");
        writeFileSync(join(tmp, ".adlc", "supervisor-recovery.json"), "{}\n");
        writeFileSync(join(tmp, ".adlc", "supervisor-recovery.md"), "# diagnosis\n");
        writeFileSync(join(tmp, ".adlc", "allow-install"), "approved\n");

        const stdout = pipeToHook({ cwd: tmp });
        expect(stdout.trim()).toBe("");

        expect(existsSync(join(tmp, ".adlc", "supervisor-state.json"))).toBe(false);
        expect(existsSync(join(tmp, ".adlc", "supervisor-events.jsonl"))).toBe(false);
        expect(existsSync(join(tmp, ".adlc", "supervisor-recovery.json"))).toBe(false);
        expect(existsSync(join(tmp, ".adlc", "supervisor-recovery.md"))).toBe(false);
        expect(existsSync(join(tmp, ".adlc", "allow-install"))).toBe(false);
    });
});

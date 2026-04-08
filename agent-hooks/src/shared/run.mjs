/** Shared shell execution utility used across all hooks. */

import { exec as execCb } from "node:child_process";

const RUN_TIMEOUT = 5 * 60_000; // 5 min per command

/** Run a command asynchronously. Never rejects — inspect `ok`. */
export function run(cwd, cmd, opts = {}) {
    return new Promise(done => {
        execCb(cmd, { cwd, maxBuffer: 10 * 1024 * 1024, timeout: RUN_TIMEOUT, ...opts }, (error, stdout, stderr) => {
            done({
                ok: !error,
                stdout: String(stdout),
                stderr: String(stderr),
                code: error?.code
            });
        });
    });
}

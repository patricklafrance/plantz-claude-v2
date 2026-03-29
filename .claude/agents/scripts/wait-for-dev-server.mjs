#!/usr/bin/env node

/**
 * wait-for-dev-server — deterministic dev server readiness check.
 *
 * Replaces `sleep N && curl localhost:<port>` polling loops with a single
 * call that polls at short intervals and gives a clear pass/fail.
 *
 * Usage:
 *   node agent-hooks/src/wait-for-dev-server.mjs --port 6006 [--timeout 90] [--name Storybook]
 *
 * Exit codes:
 *   0 — Server is ready
 *   1 — Timed out (server did not respond in time)
 *   2 — Server process is not running (nothing listening, no point waiting)
 */

import { execSync } from "node:child_process";
import { request } from "node:http";
import { argv, exit, platform } from "node:process";

const args = argv.slice(2);
const portArg = getArg(args, "--port");

if (!portArg) {
    console.error("Usage: wait-for-dev-server.mjs --port <port> [--timeout 90] [--name <label>]");
    exit(2);
}

const port = Number(portArg);
const timeoutSec = Number(getArg(args, "--timeout") ?? 90);
const serverName = getArg(args, "--name") ?? `localhost:${port}`;
const pollIntervalMs = 2000;

function getArg(list, flag) {
    const idx = list.indexOf(flag);

    return idx !== -1 && idx + 1 < list.length ? list[idx + 1] : null;
}

function isPortListening(portNum) {
    try {
        if (platform === "win32") {
            const out = execSync(`netstat -ano | findstr ":${portNum}"`, { encoding: "utf8", timeout: 5000 });

            return out.includes("LISTENING");
        }

        const out = execSync(`lsof -ti :${portNum} 2>/dev/null`, { encoding: "utf8", timeout: 5000 });

        return out.trim().length > 0;
    } catch {
        return false;
    }
}

function httpGet(url) {
    return new Promise(resolve => {
        const req = request(url, { timeout: 5000 }, res => {
            res.resume();
            resolve(res.statusCode >= 200 && res.statusCode < 400);
        });
        req.on("error", () => resolve(false));
        req.on("timeout", () => {
            req.destroy();
            resolve(false);
        });
        req.end();
    });
}

async function main() {
    const url = `http://localhost:${port}`;
    const startTime = Date.now();
    const deadline = startTime + timeoutSec * 1000;
    let attempt = 0;

    console.log(`Waiting for ${serverName} on ${url} (timeout: ${timeoutSec}s)...`);

    while (Date.now() < deadline) {
        attempt++;

        // Every 5 attempts, check if anything is listening at all.
        // If nothing is listening and we are past the first 10 seconds,
        // bail early rather than waiting the full timeout.
        if (attempt % 5 === 0 && Date.now() > startTime + 10_000) {
            if (!isPortListening(port)) {
                console.error(`Nothing listening on port ${port}. Is ${serverName} running?`);
                exit(2);
            }
        }

        const ready = await httpGet(url);
        if (ready) {
            console.log(
                `${serverName} is ready on ${url} (${attempt} attempt${attempt === 1 ? "" : "s"}, ${Math.round((Date.now() - startTime) / 1000)}s).`
            );
            exit(0);
        }

        await new Promise(r => setTimeout(r, pollIntervalMs));
    }

    console.error(`Timed out after ${timeoutSec}s waiting for ${serverName} on ${url}.`);
    exit(1);
}

main();

#!/usr/bin/env node
/* oxlint-disable no-console, no-await-in-loop -- CLI tool: console output and sequential polling are intentional */

/**
 * wait-for-dev-server — deterministic dev server readiness check.
 *
 * Replaces `sleep N && curl localhost:<port>` polling loops with a single
 * call that polls at short intervals and gives a clear pass/fail.
 *
 * Usage:
 *   node .claude/agents/scripts/wait-for-dev-server.mjs --port 6006 [--timeout 90] [--name Storybook]
 *
 * Exit codes:
 *   0 — Server is ready
 *   1 — Timed out or nothing listening (server not running)
 */

import { execSync } from "node:child_process";
import { request } from "node:http";
import { argv, exit, platform } from "node:process";

const args = argv.slice(2);
const portArg = getArg(args, "--port");

if (!portArg) {
    console.error("Usage: wait-for-dev-server.mjs --port <port> [--timeout 90] [--name <label>]");
    exit(1);
}

const port = Number(portArg);
const timeoutSec = Number(getArg(args, "--timeout") ?? 90);
const serverName = getArg(args, "--name") ?? `localhost:${port}`;
const pollIntervalMs = 2000;
const gracePeriodMs = 30_000;

function getArg(list, flag) {
    const idx = list.indexOf(flag);

    return idx !== -1 && idx + 1 < list.length ? list[idx + 1] : null;
}

function isPortListening(portNum) {
    try {
        if (platform === "win32") {
            const out = execSync(`netstat -ano | findstr "LISTENING"`, { encoding: "utf8", timeout: 5000 });

            return out.split("\n").some(line => {
                const match = line.match(/:(\d+)\s/);

                return match && match[1] === String(portNum);
            });
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

        // After the 30s grace period (enough for cold starts), check every
        // 5 attempts if anything is listening. If not, bail early — the
        // server process likely died or was never started.
        if (attempt % 5 === 0 && Date.now() > startTime + gracePeriodMs) {
            if (!isPortListening(port)) {
                const elapsed = Math.round((Date.now() - startTime) / 1000);
                console.error(`Nothing listening on port ${port} after ${elapsed}s. Is ${serverName} running?`);
                console.error(`Hint: if you started the server with \`| head\`, the pipe kills it. Use \`> /dev/null 2>&1\` instead.`);
                exit(1);
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

    // On timeout, check if anything is listening to give a diagnostic hint.
    const listening = isPortListening(port);
    if (listening) {
        console.error(
            `Timed out after ${timeoutSec}s — port ${port} is listening but ${serverName} is not responding to HTTP. May need more time or the server is stuck.`
        );
    } else {
        console.error(`Timed out after ${timeoutSec}s — nothing listening on port ${port}. Is ${serverName} running?`);
    }
    exit(1);
}

main();

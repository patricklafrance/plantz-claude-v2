#!/usr/bin/env node

import { readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

import { clearRecoveryArtifacts } from "./recovery.mjs";

const input = JSON.parse(readFileSync(0, "utf8"));
const cwd = input.cwd ?? process.cwd();

for (const fileName of ["supervisor-state.json", "supervisor-events.jsonl"]) {
    try {
        rmSync(resolve(cwd, ".adlc", fileName));
    } catch {
        // Missing file is fine.
    }
}

clearRecoveryArtifacts(cwd);

process.exit(0);

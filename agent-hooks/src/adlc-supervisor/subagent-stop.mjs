#!/usr/bin/env node

import { readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const input = JSON.parse(readFileSync(0, "utf8"));
const cwd = input.cwd ?? process.cwd();

// Manual install overrides are run-scoped escape hatches. Clear them with the rest
// of supervisor state so they do not leak across agent runs.
for (const fileName of ["supervisor-state.json", "supervisor-events.jsonl", "allow-install"]) {
    try {
        rmSync(resolve(cwd, ".adlc", fileName));
    } catch {
        // Missing file is fine.
    }
}

process.exit(0);

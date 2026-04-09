#!/usr/bin/env node

import { resolve } from "node:path";
import { parseArgs } from "node:util";

import { run } from "./workflow/orchestrator.js";

const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
        "dry-run": { type: "boolean", default: false },
        verbose: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false }
    }
});

if (values.help || positionals.length === 0) {
    console.log(`Usage: adlc [options] <feature-description>

Options:
  --dry-run           Show wave schedule without executing
  --verbose           Show full agent output instead of progress summary
  -h, --help          Show this help message`);
    process.exit(values.help ? 0 : 1);
}

const featureDescription = positionals.join(" ");
const cwd = resolve(process.cwd());

try {
    await run(featureDescription, {
        cwd,
        dryRun: values["dry-run"],
        verbose: values.verbose
    });
} catch {
    process.exitCode = 1;
}

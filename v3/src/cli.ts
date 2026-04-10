#!/usr/bin/env node

import { existsSync, writeFileSync } from "node:fs";
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

const command = positionals[0];

if (command === "init") {
    const cwd = resolve(process.cwd());
    const configPath = resolve(cwd, "adlc.config.ts");

    if (existsSync(configPath)) {
        console.log("adlc.config.ts already exists — skipping.");
    } else {
        writeFileSync(
            configPath,
            `import { defineConfig } from "@patlaf/adlc";\n\nexport default defineConfig({});\n`
        );
        console.log("Created adlc.config.ts");
    }

    process.exit(0);
}

if (values.help || positionals.length === 0) {
    console.log(`Usage: adlc [options] <feature-description>
       adlc init

Commands:
  init                Scaffold adlc.config.ts if not present

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

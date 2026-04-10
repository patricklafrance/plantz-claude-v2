/**
 * Repository preflight validation — runs at the start of every run()
 * to catch misconfiguration early with clear error messages.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const REQUIRED_SCRIPTS = [
    "build",
    "lint",
    "test",
    "typecheck",
    "oxlint",
    "oxlint-auto-fix",
    "oxfmt",
    "oxfmt-auto-fix",
    "dev-host",
    "dev-storybook"
] as const;

const REQUIRED_DEV_DEPENDENCIES = [
    "oxlint",
    "oxfmt",
    "agent-browser"
] as const;

/**
 * Validate that the consumer's repo has the required scripts and devDependencies.
 * Throws on the first missing item with a clear error message.
 */
export function validateRepository(cwd: string): void {
    const pkgPath = join(cwd, "package.json");
    let pkg: { scripts?: Record<string, string>; devDependencies?: Record<string, string> };

    try {
        pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    } catch {
        throw new Error(`Cannot read ${pkgPath}. Ensure a package.json exists in the target repository root.`);
    }

    const scripts = pkg.scripts ?? {};

    for (const name of REQUIRED_SCRIPTS) {
        if (!scripts[name]) {
            throw new Error(
                `Missing script \`${name}\` in root package.json. The ADLC harness expects: ${REQUIRED_SCRIPTS.join(", ")}`
            );
        }
    }

    const devDeps = pkg.devDependencies ?? {};

    for (const name of REQUIRED_DEV_DEPENDENCIES) {
        if (!devDeps[name]) {
            throw new Error(
                `Missing devDependency \`${name}\` in root package.json`
            );
        }
    }
}

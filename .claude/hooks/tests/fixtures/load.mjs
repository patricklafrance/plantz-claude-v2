import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const FIXTURES_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * Read a fixture file by agent and filename.
 * @param {string} agent - e.g. "planner", "reviewer", "architect"
 * @param {string} name - e.g. "slice-01-plant-list.valid.md"
 * @returns {string} file contents
 */
export function loadFixture(agent, name) {
    return readFileSync(resolve(FIXTURES_DIR, agent, name), "utf8");
}

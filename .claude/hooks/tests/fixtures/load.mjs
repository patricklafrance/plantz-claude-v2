import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const FIXTURES_DIR = dirname(fileURLToPath(import.meta.url));
const cache = new Map();

/**
 * Read a fixture file by agent and filename.
 * Results are cached in-process to avoid redundant I/O across tests.
 * @param {string} agent - e.g. "planner", "reviewer", "architect"
 * @param {string} name - e.g. "slice-01-plant-list.valid.md"
 * @returns {string} file contents
 */
export function loadFixture(agent, name) {
    const key = `${agent}/${name}`;
    if (!cache.has(key)) {
        cache.set(key, readFileSync(resolve(FIXTURES_DIR, agent, name), "utf8"));
    }
    return cache.get(key);
}

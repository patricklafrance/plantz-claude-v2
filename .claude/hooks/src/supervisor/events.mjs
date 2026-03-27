import { appendFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const EVENTS_FILE = "supervisor-events.jsonl";

export function appendEvent(cwd, event) {
    const dir = resolve(cwd, ".adlc");
    mkdirSync(dir, { recursive: true });
    appendFileSync(resolve(dir, EVENTS_FILE), JSON.stringify(event) + "\n");
}

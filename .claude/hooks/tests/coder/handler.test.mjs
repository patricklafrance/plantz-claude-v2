import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import handleCoder from "../../src/adlc-verification/coder/handler.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("coder handler (full pipeline)", () => {
    it("should return an array of problems", async () => {
        const problems = await handleCoder(REPO_ROOT);
        expect(Array.isArray(problems)).toBe(true);
        // On a clean repo without .adlc/implementation-notes.md, we expect at least that check to fail
        expect(problems.some(p => p.includes("implementation-notes"))).toBe(true);
    });
});

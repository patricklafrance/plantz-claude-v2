import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import handlePreCommit from "../../pre-commit/handler.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("pre-commit handler (full pipeline)", () => {
    it("should return an array of problems", async () => {
        const problems = await handlePreCommit(REPO_ROOT);
        expect(Array.isArray(problems)).toBe(true);
    });
});

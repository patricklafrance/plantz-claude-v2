import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { tests } from "../../pre-commit/tests.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("pre-commit tests", () => {
    it("should return an array", async () => {
        const result = await tests(REPO_ROOT);
        expect(Array.isArray(result)).toBe(true);
    });
});

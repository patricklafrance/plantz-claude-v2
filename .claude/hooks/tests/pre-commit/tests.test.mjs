import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { tests } from "../../src/pre-commit/tests.mjs";

vi.mock("../../src/shared/run.mjs", () => ({
    run: vi.fn().mockResolvedValue({ ok: true, stdout: "", stderr: "" })
}));

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("pre-commit tests", () => {
    it("should return an array", async () => {
        const result = await tests(REPO_ROOT);
        expect(Array.isArray(result)).toBe(true);
    });
});

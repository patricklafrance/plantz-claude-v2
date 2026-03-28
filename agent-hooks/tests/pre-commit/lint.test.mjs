import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { lint } from "../../src/pre-commit/lint.mjs";

vi.mock("../../src/shared/run.mjs", () => ({
    run: vi.fn().mockResolvedValue({ ok: true, stdout: "", stderr: "" })
}));

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("pre-commit lint", () => {
    it("should return an array", async () => {
        const result = await lint(REPO_ROOT);
        expect(Array.isArray(result)).toBe(true);
    });
});

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import handlePreCommit from "../../src/pre-commit/handler.mjs";

vi.mock("../../src/shared/run.mjs", () => ({
    run: vi.fn().mockResolvedValue({ ok: true, stdout: "", stderr: "" })
}));

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("pre-commit handler (full pipeline)", () => {
    it("should return an array of problems", async () => {
        const problems = await handlePreCommit(REPO_ROOT);
        expect(Array.isArray(problems)).toBe(true);
    });
});

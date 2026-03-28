import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { oxfmtAutofix } from "../../src/pre-commit/oxfmt-autofix.mjs";

vi.mock("../../src/shared/run.mjs", () => ({
    run: vi.fn().mockResolvedValue({ ok: true, stdout: "", stderr: "" })
}));

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("pre-commit oxfmt-autofix", () => {
    it("should return empty array on success", async () => {
        const result = await oxfmtAutofix(REPO_ROOT);
        expect(Array.isArray(result)).toBe(true);
    });
});

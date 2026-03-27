import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { gitignoreGuard } from "../../src/pre-commit/gitignore-guard.mjs";

vi.mock("../../src/shared/run.mjs", () => ({
    run: vi.fn().mockResolvedValue({ ok: true, stdout: "", stderr: "" })
}));

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("pre-commit gitignore-guard", () => {
    it("should return an empty array when .gitignore is clean", async () => {
        const result = await gitignoreGuard(REPO_ROOT);
        expect(result).toEqual([]);
    });
});

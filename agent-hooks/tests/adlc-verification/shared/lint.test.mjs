import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { lint } from "../../../src/adlc-verification/shared/lint.mjs";

vi.mock("../../../src/adlc-verification/utils.mjs", () => ({
    run: vi.fn().mockResolvedValue({ ok: true, stdout: "", stderr: "" }),
    hasFile: vi.fn().mockReturnValue(false),
    listFiles: vi.fn().mockReturnValue([]),
    getChangedFiles: vi.fn().mockReturnValue([])
}));

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");

describe("lint", () => {
    it("should return an array", async () => {
        const result = await lint(REPO_ROOT);
        expect(Array.isArray(result)).toBe(true);
    });
});

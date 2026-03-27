import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { tests } from "../../../src/adlc-verification/coder/tests.mjs";

vi.mock("../../../src/adlc-verification/utils.mjs", () => ({
    run: vi.fn().mockResolvedValue({ ok: true, stdout: "", stderr: "" }),
    hasFile: vi.fn().mockReturnValue(false),
    listFiles: vi.fn().mockReturnValue([]),
    getChangedFiles: vi.fn().mockReturnValue([])
}));

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");

describe("tests", () => {
    it("should return an array", async () => {
        const result = await tests(REPO_ROOT);
        expect(Array.isArray(result)).toBe(true);
    });
});

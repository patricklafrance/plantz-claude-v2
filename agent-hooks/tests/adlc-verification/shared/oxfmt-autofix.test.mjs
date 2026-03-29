import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { oxfmtAutofix } from "../../../src/adlc-verification/shared/oxfmt-autofix.mjs";

vi.mock("../../../src/adlc-verification/utils.mjs", () => ({
    run: vi.fn().mockResolvedValue({ ok: true, stdout: "", stderr: "" }),
    hasFile: vi.fn().mockReturnValue(false),
    listFiles: vi.fn().mockReturnValue([]),
    getChangedFiles: vi.fn().mockReturnValue([])
}));

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");

describe("oxfmt-autofix", () => {
    it("should return empty array on success", async () => {
        const result = await oxfmtAutofix(REPO_ROOT);
        expect(Array.isArray(result)).toBe(true);
    });
});

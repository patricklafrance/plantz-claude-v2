import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import handleDocument from "../../../src/adlc-verification/document/handler.mjs";

vi.mock("../../../src/adlc-verification/utils.mjs", () => ({
    run: vi.fn().mockResolvedValue({ ok: true, stdout: "", stderr: "" }),
    hasFile: vi.fn().mockReturnValue(false),
    listFiles: vi.fn().mockReturnValue([]),
    getChangedFiles: vi.fn().mockReturnValue([])
}));

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");

describe("document handler", () => {
    it("should return an array (oxfmt autofix on clean repo)", async () => {
        const problems = await handleDocument(REPO_ROOT);
        expect(Array.isArray(problems)).toBe(true);
        expect(problems).toHaveLength(0);
    });
});

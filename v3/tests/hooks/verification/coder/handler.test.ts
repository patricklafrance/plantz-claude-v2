import { describe, expect, it, vi } from "vitest";

import { handleCoder } from "../../../../src/hooks/verification/coder/handler.js";

vi.mock("../../../../src/hooks/verification/utils.js", () => ({
    run: vi.fn().mockResolvedValue({ ok: true, stdout: "", stderr: "" }),
    hasFile: vi.fn().mockReturnValue(false),
    listFiles: vi.fn().mockReturnValue([]),
    getChangedFiles: vi.fn().mockReturnValue([])
}));

describe("coder handler (full pipeline)", () => {
    it("should return an array of problems", async () => {
        const problems = await handleCoder(process.cwd());
        expect(Array.isArray(problems)).toBe(true);
        // On a clean repo without .adlc/implementation-notes.md, we expect at least that check to fail
        expect(problems.some(p => p.includes("implementation-notes"))).toBe(true);
    });
});

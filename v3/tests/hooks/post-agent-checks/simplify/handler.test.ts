import { describe, expect, it, vi } from "vitest";

import { handleSimplify } from "../../../../src/hooks/verification/simplify/handler.js";

vi.mock("../../../../src/hooks/verification/utils.js", () => ({
    run: vi.fn().mockResolvedValue({ ok: true, stdout: "", stderr: "" }),
    hasFile: vi.fn().mockReturnValue(false),
    listFiles: vi.fn().mockReturnValue([]),
    getChangedFiles: vi.fn().mockReturnValue([])
}));

describe("simplify handler (full pipeline)", () => {
    it("should return an array of problems", async () => {
        const problems = await handleSimplify(process.cwd());
        expect(Array.isArray(problems)).toBe(true);
        expect(problems).toHaveLength(0);
    });
});

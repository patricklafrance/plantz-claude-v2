import { describe, expect, it, vi } from "vitest";

import { handleDocument } from "../../../../src/hooks/verification/document/handler.js";

vi.mock("../../../../src/hooks/verification/utils.js", () => ({
    run: vi.fn().mockResolvedValue({ ok: true, stdout: "", stderr: "" })
}));

describe("document handler", () => {
    it("should return an array (oxfmt autofix on clean repo)", async () => {
        const problems = await handleDocument(process.cwd());
        expect(Array.isArray(problems)).toBe(true);
        expect(problems).toHaveLength(0);
    });
});

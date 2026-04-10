import { beforeEach, describe, expect, it, vi } from "vitest";

import { run } from "../../../src/hooks/post-agent-checks/utils.js";

vi.mock("../../../src/hooks/post-agent-checks/utils.js", () => ({
    run: vi.fn()
}));

import { oxfmtAutofix } from "../../../src/hooks/pre-commit/oxfmt-autofix.js";

describe("pre-commit oxfmt-autofix", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("returns empty array and stages changes on success", async () => {
        vi.mocked(run).mockResolvedValue({ ok: true, stdout: "", stderr: "", code: undefined });
        const result = await oxfmtAutofix("/tmp/test");
        expect(result).toEqual([]);

        // Should have called git add -u after formatting
        expect(run).toHaveBeenCalledWith("/tmp/test", "git add -u");
    });

    it("retries once on the known CSS import resolver race condition", async () => {
        vi.mocked(run)
            .mockResolvedValueOnce({ ok: false, stdout: "", stderr: "Cannot use 'in' operator to search for 'importer'", code: 1 })
            .mockResolvedValueOnce({ ok: true, stdout: "", stderr: "", code: undefined })
            .mockResolvedValue({ ok: true, stdout: "", stderr: "", code: undefined });

        const result = await oxfmtAutofix("/tmp/test");
        expect(result).toEqual([]);

        // oxfmt called twice (retry), then git add -u
        expect(run).toHaveBeenCalledTimes(3);
    });

    it("returns error when oxfmt fails with non-transient error", async () => {
        vi.mocked(run).mockResolvedValue({ ok: false, stdout: "", stderr: "Unexpected token", code: 1 });
        const result = await oxfmtAutofix("/tmp/test");
        expect(result).toHaveLength(1);
        expect(result[0]).toContain("[oxfmt] Auto-format failed");
    });
});

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { formatFix } from "../../../src/hooks/post-agent-checks/format-fix.js";

vi.mock("../../../src/hooks/post-agent-checks/utils.js", () => ({
    run: vi.fn().mockResolvedValue({ ok: true, stdout: "", stderr: "" })
}));

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("formatFix", () => {
    it("should return empty array on success", async () => {
        const result = await formatFix(REPO_ROOT);
        expect(Array.isArray(result)).toBe(true);
    });
});

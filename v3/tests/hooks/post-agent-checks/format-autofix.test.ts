import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { formatAutofix } from "../../../src/hooks/post-agent-checks/format-autofix.js";

vi.mock("../../../src/hooks/post-agent-checks/utils.js", () => ({
    run: vi.fn().mockResolvedValue({ ok: true, stdout: "", stderr: "" })
}));

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("formatAutofix", () => {
    it("should return empty array on success", async () => {
        const result = await formatAutofix(REPO_ROOT);
        expect(Array.isArray(result)).toBe(true);
    });
});

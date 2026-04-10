import { describe, expect, it, vi } from "vitest";

import { noSecretsCheck } from "../../../../src/hooks/post-agent-checks/coder/no-secrets-check.js";

vi.mock("../../../../src/hooks/post-agent-checks/utils.js", () => ({
    run: vi.fn().mockResolvedValue({ ok: true, stdout: "", stderr: "" })
}));

describe("no-secrets-check", () => {
    it("should return an array (soft-fail if gitleaks missing)", async () => {
        const result = await noSecretsCheck(process.cwd(), ["package.json"]);
        expect(Array.isArray(result)).toBe(true);
    });
});

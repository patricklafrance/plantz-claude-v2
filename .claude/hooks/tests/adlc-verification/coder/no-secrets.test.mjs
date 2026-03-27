import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { noSecrets } from "../../../src/adlc-verification/coder/no-secrets.mjs";

vi.mock("../../../src/adlc-verification/utils.mjs", () => ({
    run: vi.fn().mockResolvedValue({ ok: true, stdout: "", stderr: "" }),
    hasFile: vi.fn().mockReturnValue(false),
    listFiles: vi.fn().mockReturnValue([]),
    getChangedFiles: vi.fn().mockReturnValue([])
}));

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");

describe("no-secrets", () => {
    it("should return an array (soft-fail if gitleaks missing)", async () => {
        const result = await noSecrets(REPO_ROOT, ["package.json"]);
        expect(Array.isArray(result)).toBe(true);
    });
});

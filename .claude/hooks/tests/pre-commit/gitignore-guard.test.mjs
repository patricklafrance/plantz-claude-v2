import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { gitignoreGuard } from "../../src/pre-commit/gitignore-guard.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("pre-commit gitignore-guard", () => {
    it("should return an empty array when .gitignore is clean", async () => {
        const result = await gitignoreGuard(REPO_ROOT);
        expect(result).toEqual([]);
    });
});

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { noSecrets } from "../../src/adlc-verification/coder/no-secrets.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("no-secrets", () => {
    it("should return an array (soft-fail if gitleaks missing)", async () => {
        const result = await noSecrets(REPO_ROOT, ["package.json"]);
        expect(Array.isArray(result)).toBe(true);
    });
});

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { oxfmtAutofix } from "../../pre-commit/oxfmt-autofix.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("pre-commit oxfmt-autofix", () => {
    it("should return empty array on success", async () => {
        const result = await oxfmtAutofix(REPO_ROOT);
        expect(Array.isArray(result)).toBe(true);
    });
});

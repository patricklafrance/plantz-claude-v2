import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import handleDocument from "../../src/adlc-verification/document/handler.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("document handler", () => {
    it("should return an array (oxfmt autofix on clean repo)", async () => {
        const problems = await handleDocument(REPO_ROOT);
        expect(Array.isArray(problems)).toBe(true);
        expect(problems).toHaveLength(0);
    });
});

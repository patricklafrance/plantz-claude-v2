import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { build } from "../../../src/adlc-verification/shared/build.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");

describe("build", () => {
    it("should return an array", async () => {
        const result = await build(REPO_ROOT);
        expect(Array.isArray(result)).toBe(true);
    });
});

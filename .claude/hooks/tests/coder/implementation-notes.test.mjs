import { describe, expect, it } from "vitest";

import { implementationNotesCheck } from "../../src/adlc-verification/coder/implementation-notes.mjs";

describe("implementation-notes", () => {
    it("should pass when file is in changed list", () => {
        const result = implementationNotesCheck([".adlc/implementation-notes.md", "apps/host/src/index.ts"]);
        expect(result).toHaveLength(0);
    });

    it("should fail when file is missing from changed list", () => {
        const result = implementationNotesCheck(["apps/host/src/index.ts"]);
        expect(result).toHaveLength(1);
        expect(result[0]).toContain("implementation-notes");
    });
});

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { revisionSliceRefs } from "../../adlc-verification/architect/revision-slice-refs.mjs";

describe("revision-slice-refs", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-arch-sr-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should pass when no revision file exists", () => {
        expect(revisionSliceRefs(tmp)).toHaveLength(0);
    });

    it("should pass when revision references a slice", () => {
        writeFileSync(join(tmp, ".adlc/architect-revision.md"), "## Evidence\n\n- Slice 01 defines the route\n");
        expect(revisionSliceRefs(tmp)).toHaveLength(0);
    });

    it("should pass with various slice reference formats", () => {
        writeFileSync(join(tmp, ".adlc/architect-revision.md"), "Slice 3 conflicts with Slice 12\n");
        expect(revisionSliceRefs(tmp)).toHaveLength(0);
    });

    it("should fail when no slice is referenced", () => {
        writeFileSync(join(tmp, ".adlc/architect-revision.md"), "The data model is wrong. Fix the entities.\n");
        const problems = revisionSliceRefs(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("slice references");
    });
});

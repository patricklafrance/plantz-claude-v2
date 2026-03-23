import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { revisionStructure } from "../../adlc-verification/architect/revision-structure.mjs";

describe("revision-structure", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-arch-rs-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should pass when no revision file exists", () => {
        expect(revisionStructure(tmp)).toHaveLength(0);
    });

    it("should pass when all sections are present", () => {
        writeFileSync(
            join(tmp, ".adlc/architect-revision.md"),
            [
                "# Architect Revision",
                "",
                "## Problem",
                "",
                "Something.",
                "",
                "## Evidence",
                "",
                "- Slice 01: proof",
                "",
                "## Required Changes",
                "",
                "Fix it."
            ].join("\n")
        );
        expect(revisionStructure(tmp)).toHaveLength(0);
    });

    it("should fail when Problem section is missing", () => {
        writeFileSync(
            join(tmp, ".adlc/architect-revision.md"),
            ["# Architect Revision", "", "## Evidence", "", "- Slice 01: proof", "", "## Required Changes", "", "Fix it."].join("\n")
        );
        const problems = revisionStructure(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("## Problem");
    });

    it("should fail when Evidence section is missing", () => {
        writeFileSync(
            join(tmp, ".adlc/architect-revision.md"),
            ["# Architect Revision", "", "## Problem", "", "Something.", "", "## Required Changes", "", "Fix it."].join("\n")
        );
        const problems = revisionStructure(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("## Evidence");
    });

    it("should fail when Required Changes section is missing", () => {
        writeFileSync(
            join(tmp, ".adlc/architect-revision.md"),
            ["# Architect Revision", "", "## Problem", "", "Something.", "", "## Evidence", "", "- Slice 01: proof"].join("\n")
        );
        const problems = revisionStructure(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("## Required Changes");
    });

    it("should list all missing sections", () => {
        writeFileSync(join(tmp, ".adlc/architect-revision.md"), "# Architect Revision\n\nSome text.\n");
        const problems = revisionStructure(tmp);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("## Problem");
        expect(problems[0]).toContain("## Evidence");
        expect(problems[0]).toContain("## Required Changes");
    });
});

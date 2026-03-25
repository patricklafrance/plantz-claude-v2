import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { contextRefresh, extractSliceId } from "../../src/adlc-verification/coder/context-refresh.mjs";

describe("extractSliceId", () => {
    it("should extract id from frontmatter", () => {
        expect(extractSliceId("---\nid: slice-1\n---\n# Slice 1: Plant List\n")).toBe("slice-1");
    });

    it("should handle extra whitespace around id value", () => {
        expect(extractSliceId("---\nid:   slice-2  \n---\n")).toBe("slice-2");
    });

    it("should return null when no frontmatter", () => {
        expect(extractSliceId("# Slice 1: Plant List\nNo frontmatter")).toBeNull();
    });

    it("should return null when frontmatter has no id field", () => {
        expect(extractSliceId("---\ntitle: something\n---\n")).toBeNull();
    });
});

describe("contextRefresh", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-cr-"));
        mkdirSync(join(tmp, ".adlc"), { recursive: true });
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should pass when current-slice.md does not exist", () => {
        expect(contextRefresh(tmp)).toHaveLength(0);
    });

    it("should pass when current-slice.md has no frontmatter id", () => {
        writeFileSync(join(tmp, ".adlc/current-slice.md"), "# Slice 1: Plant List\nNo frontmatter");
        expect(contextRefresh(tmp)).toHaveLength(0);
    });

    it("should block on first stop for a slice", () => {
        writeFileSync(join(tmp, ".adlc/current-slice.md"), "---\nid: slice-1\n---\n# Slice 1: Plant List\n\n- [ ] criterion\n");

        const result = contextRefresh(tmp);
        expect(result).toHaveLength(1);
        expect(result[0]).toContain("context-refresh");
    });

    it("should write marker after blocking", () => {
        writeFileSync(join(tmp, ".adlc/current-slice.md"), "---\nid: slice-1\n---\n# Slice 1: Plant List\n\n- [ ] criterion\n");

        contextRefresh(tmp);

        const markers = JSON.parse(readFileSync(join(tmp, ".adlc/markers.json"), "utf8"));
        expect(markers["context-refresh:slice-1"]).toBe(true);
    });

    it("should pass on second stop for the same slice", () => {
        writeFileSync(join(tmp, ".adlc/current-slice.md"), "---\nid: slice-1\n---\n# Slice 1: Plant List\n\n- [ ] criterion\n");

        // First stop — blocks
        expect(contextRefresh(tmp)).toHaveLength(1);

        // Second stop — passes
        expect(contextRefresh(tmp)).toHaveLength(0);
    });

    it("should block independently per slice", () => {
        // Slice 1 — block, then mark
        writeFileSync(join(tmp, ".adlc/current-slice.md"), "---\nid: slice-1\n---\n# Slice 1: Plant List\n");
        expect(contextRefresh(tmp)).toHaveLength(1);
        expect(contextRefresh(tmp)).toHaveLength(0);

        // Slice 2 — should block again (different key)
        writeFileSync(join(tmp, ".adlc/current-slice.md"), "---\nid: slice-2\n---\n# Slice 2: Watering\n");
        expect(contextRefresh(tmp)).toHaveLength(1);
        expect(contextRefresh(tmp)).toHaveLength(0);
    });

    it("should preserve existing markers when adding new ones", () => {
        writeFileSync(join(tmp, ".adlc/markers.json"), JSON.stringify({ "other-hook:key": true }) + "\n");
        writeFileSync(join(tmp, ".adlc/current-slice.md"), "---\nid: slice-1\n---\n# Slice 1: Plant List\n");

        contextRefresh(tmp);

        const markers = JSON.parse(readFileSync(join(tmp, ".adlc/markers.json"), "utf8"));
        expect(markers["other-hook:key"]).toBe(true);
        expect(markers["context-refresh:slice-1"]).toBe(true);
    });

    it("should mention all three concerns in the block message", () => {
        writeFileSync(join(tmp, ".adlc/current-slice.md"), "---\nid: slice-1\n---\n# Slice 1: Plant List\n");

        const result = contextRefresh(tmp);
        expect(result[0]).toContain("MSW handlers");
        expect(result[0]).toContain("Story variants");
        expect(result[0]).toContain("Implementation notes");
    });
});

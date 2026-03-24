import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { contextRefresh, deriveSliceKey } from "../../src/adlc-verification/coder/context-refresh.mjs";

describe("deriveSliceKey", () => {
    it("should derive key from standard slice heading", () => {
        expect(deriveSliceKey("# Slice 1: Plant List\n\nSome content")).toBe("slice-1-plant-list");
    });

    it("should derive key from heading with special characters", () => {
        expect(deriveSliceKey("# Slice 2: Watering & Care\n")).toBe("slice-2-watering-care");
    });

    it("should return null when no heading found", () => {
        expect(deriveSliceKey("No heading here\nJust text")).toBeNull();
    });

    it("should handle heading with extra spaces", () => {
        expect(deriveSliceKey("#   Slice  3:  Color  Mode  \n")).toBe("slice-3-color-mode");
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

    it("should pass when current-slice.md has no heading", () => {
        writeFileSync(join(tmp, ".adlc/current-slice.md"), "No heading here");
        expect(contextRefresh(tmp)).toHaveLength(0);
    });

    it("should block on first stop for a slice", () => {
        writeFileSync(join(tmp, ".adlc/current-slice.md"), "# Slice 1: Plant List\n\n- [ ] criterion\n");

        const result = contextRefresh(tmp);
        expect(result).toHaveLength(1);
        expect(result[0]).toContain("context-refresh");
    });

    it("should write marker after blocking", () => {
        writeFileSync(join(tmp, ".adlc/current-slice.md"), "# Slice 1: Plant List\n\n- [ ] criterion\n");

        contextRefresh(tmp);

        const markers = JSON.parse(readFileSync(join(tmp, ".adlc/markers.json"), "utf8"));
        expect(markers["context-refresh:slice-1-plant-list"]).toBe(true);
    });

    it("should pass on second stop for the same slice", () => {
        writeFileSync(join(tmp, ".adlc/current-slice.md"), "# Slice 1: Plant List\n\n- [ ] criterion\n");

        // First stop — blocks
        expect(contextRefresh(tmp)).toHaveLength(1);

        // Second stop — passes
        expect(contextRefresh(tmp)).toHaveLength(0);
    });

    it("should block independently per slice", () => {
        // Slice 1 — block, then mark
        writeFileSync(join(tmp, ".adlc/current-slice.md"), "# Slice 1: Plant List\n");
        expect(contextRefresh(tmp)).toHaveLength(1);
        expect(contextRefresh(tmp)).toHaveLength(0);

        // Slice 2 — should block again (different key)
        writeFileSync(join(tmp, ".adlc/current-slice.md"), "# Slice 2: Watering\n");
        expect(contextRefresh(tmp)).toHaveLength(1);
        expect(contextRefresh(tmp)).toHaveLength(0);
    });

    it("should preserve existing markers when adding new ones", () => {
        writeFileSync(join(tmp, ".adlc/markers.json"), JSON.stringify({ "other-hook:key": true }) + "\n");
        writeFileSync(join(tmp, ".adlc/current-slice.md"), "# Slice 1: Plant List\n");

        contextRefresh(tmp);

        const markers = JSON.parse(readFileSync(join(tmp, ".adlc/markers.json"), "utf8"));
        expect(markers["other-hook:key"]).toBe(true);
        expect(markers["context-refresh:slice-1-plant-list"]).toBe(true);
    });

    it("should mention all three concerns in the block message", () => {
        writeFileSync(join(tmp, ".adlc/current-slice.md"), "# Slice 1: Plant List\n");

        const result = contextRefresh(tmp);
        expect(result[0]).toContain("MSW handlers");
        expect(result[0]).toContain("Story variants");
        expect(result[0]).toContain("Implementation notes");
    });
});

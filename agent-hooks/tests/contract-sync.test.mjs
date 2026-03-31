/**
 * Contract-sync test — catches drift between ADLC skill outputs and golden-file fixtures.
 *
 * Scope:
 *   1. Artifact existence — every skill's output has a corresponding fixture
 *   2. Criteria cross-reference — reviewer result fixtures cover all criteria
 *      from their matching slice fixtures (the highest-value contract)
 *
 * Structural validation (headings, checkbox regex, table format) is the hooks'
 * job — hook tests already verify that using these same fixtures.
 */

import { readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { loadFixture } from "./fixtures/load.mjs";

// ── Helpers ──────────────────────────────────────────────────

const FIXTURES_DIR = resolve(import.meta.dirname, "fixtures");

function fixtureExists(agent, name) {
    try {
        loadFixture(agent, name);
        return true;
    } catch {
        return false;
    }
}

function listFixtures(agent) {
    return readdirSync(resolve(FIXTURES_DIR, agent)).filter(f => f.endsWith(".md"));
}

function extractCriteria(content, regex) {
    const criteria = [];
    for (const line of content.split("\n")) {
        const match = line.match(regex);
        if (match) {
            criteria.push(match[1]);
        }
    }
    return criteria;
}

// ── Artifact existence ───────────────────────────────────────

describe("contract-sync: artifact fixtures exist", () => {
    it("planner: plan-header fixture", () => {
        expect(fixtureExists("planner", "plan-header.valid.md")).toBe(true);
    });

    it("planner: at least one slice fixture", () => {
        const slices = listFixtures("planner").filter(f => f.startsWith("slice-") && f.includes(".valid."));
        expect(slices.length).toBeGreaterThanOrEqual(1);
    });

    it("planner: invalid slice fixture (no criteria)", () => {
        expect(fixtureExists("planner", "slice-no-criteria.invalid.md")).toBe(true);
    });

    it("reviewer: at least one results fixture", () => {
        const results = listFixtures("reviewer").filter(f => f.startsWith("results-") && f.includes(".valid."));
        expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it("plan-gate: revision fixture", () => {
        expect(fixtureExists("plan-gate", "revision.valid.md")).toBe(true);
    });

    it("plan-gate: invalid revision fixture (no refs)", () => {
        expect(fixtureExists("plan-gate", "revision-no-refs.invalid.md")).toBe(true);
    });

    it("module-mapper: mapping fixture", () => {
        expect(fixtureExists("module-mapper", "module-mapping.valid.md")).toBe(true);
    });

    it("coder: implementation-notes fixture directory", () => {
        const notes = listFixtures("coder/implementation-notes");
        expect(notes.length).toBeGreaterThanOrEqual(1);
    });
});

// ── Criteria cross-reference ─────────────────────────────────
// The reviewer must not skip any acceptance criteria from the slice.
// If a fixture pair drifts (criteria text changes in one but not the other),
// this test fails before the hook test does, making the cause obvious.

describe("contract-sync: reviewer criteria coverage", () => {
    it("slice-01 criteria should all appear in results-all-pass fixture", () => {
        const slice = loadFixture("planner", "slice-01-plant-list.valid.md");
        const results = loadFixture("reviewer", "results-slice-1-all-pass.valid.md");

        const sliceCriteria = extractCriteria(slice, /^[-*]\s*\[[ ]\]\s+(.+)$/);
        const resultsCriteria = extractCriteria(results, /^[-*]\s*\[[x ]\]\s+(.+)$/i);

        expect(sliceCriteria.length, "slice fixture has no criteria").toBeGreaterThan(0);

        for (const criterion of sliceCriteria) {
            const normalized = criterion.toLowerCase().trim();
            const found = resultsCriteria.some(r => r.toLowerCase().trim().includes(normalized) || normalized.includes(r.toLowerCase().trim()));
            expect(found, `Criterion "${criterion}" not found in results fixture`).toBe(true);
        }
    });

    it("slice-02 criteria should all appear in results-with-failure fixture", () => {
        const slice = loadFixture("planner", "slice-02-watering.valid.md");
        const results = loadFixture("reviewer", "results-slice-2-with-failure.valid.md");

        const sliceCriteria = extractCriteria(slice, /^[-*]\s*\[[ ]\]\s+(.+)$/);
        const resultsCriteria = extractCriteria(results, /^[-*]\s*\[[x ]\]\s+(.+)$/i);

        // Strip failure reasons (same logic as criteria-coverage.mjs)
        const cleanedResults = resultsCriteria.map(r => r.replace(/\s+[—–-]\s+.+$/, ""));

        expect(sliceCriteria.length, "slice fixture has no criteria").toBeGreaterThan(0);

        for (const criterion of sliceCriteria) {
            const normalized = criterion.toLowerCase().trim();
            const found = cleanedResults.some(r => r.toLowerCase().trim().includes(normalized) || normalized.includes(r.toLowerCase().trim()));
            expect(found, `Criterion "${criterion}" not found in results fixture`).toBe(true);
        }
    });
});

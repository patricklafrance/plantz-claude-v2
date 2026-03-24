import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { storyCoverage } from "../../src/adlc-verification/coder/story-coverage.mjs";

describe("story-coverage", () => {
    let tmp;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), "adlc-sc-"));
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it("should pass when component has a matching story file", () => {
        mkdirSync(join(tmp, "apps/today/landing-page/src"), { recursive: true });
        writeFileSync(join(tmp, "apps/today/landing-page/src/PlantCard.tsx"), "export function PlantCard() {}");
        writeFileSync(join(tmp, "apps/today/landing-page/src/PlantCard.stories.tsx"), "export default {}");

        const result = storyCoverage(tmp, ["apps/today/landing-page/src/PlantCard.tsx"]);
        expect(result).toHaveLength(0);
    });

    it("should fail when component is missing a story file", () => {
        mkdirSync(join(tmp, "apps/today/landing-page/src"), { recursive: true });
        writeFileSync(join(tmp, "apps/today/landing-page/src/PlantCard.tsx"), "export function PlantCard() {}");

        const result = storyCoverage(tmp, ["apps/today/landing-page/src/PlantCard.tsx"]);
        expect(result).toHaveLength(1);
        expect(result[0]).toContain("PlantCard.stories.tsx");
    });

    it("should skip story files themselves", () => {
        const result = storyCoverage(tmp, ["apps/today/landing-page/src/PlantCard.stories.tsx"]);
        expect(result).toHaveLength(0);
    });

    it("should skip test files", () => {
        const result = storyCoverage(tmp, ["apps/today/landing-page/src/PlantCard.test.tsx"]);
        expect(result).toHaveLength(0);
    });

    it("should skip index files", () => {
        const result = storyCoverage(tmp, ["apps/today/landing-page/src/index.tsx"]);
        expect(result).toHaveLength(0);
    });

    it("should skip registration files", () => {
        const result = storyCoverage(tmp, ["apps/today/landing-page/src/registerTodayLandingPage.tsx"]);
        expect(result).toHaveLength(0);
    });

    it("should skip storybook setup files", () => {
        const result = storyCoverage(tmp, ["apps/today/landing-page/src/storybook.setup.tsx"]);
        expect(result).toHaveLength(0);
    });

    it("should skip Context files", () => {
        const result = storyCoverage(tmp, ["apps/today/landing-page/src/TodayPlantsContext.tsx"]);
        expect(result).toHaveLength(0);
    });

    it("should skip files in mocks directory", () => {
        const result = storyCoverage(tmp, ["apps/today/landing-page/src/mocks/handlers.tsx"]);
        expect(result).toHaveLength(0);
    });

    it("should skip storybook app files", () => {
        const result = storyCoverage(tmp, ["apps/today/storybook/preview.tsx"]);
        expect(result).toHaveLength(0);
    });

    it("should skip host app files", () => {
        const result = storyCoverage(tmp, ["apps/host/src/App.tsx"]);
        expect(result).toHaveLength(0);
    });

    it("should skip non-tsx files", () => {
        const result = storyCoverage(tmp, ["apps/today/landing-page/src/plantsApi.ts"]);
        expect(result).toHaveLength(0);
    });

    it("should skip files outside module src directories", () => {
        const result = storyCoverage(tmp, ["packages/components/src/Button.tsx"]);
        expect(result).toHaveLength(0);
    });

    it("should report multiple missing stories", () => {
        mkdirSync(join(tmp, "apps/today/landing-page/src"), { recursive: true });
        writeFileSync(join(tmp, "apps/today/landing-page/src/PlantCard.tsx"), "");
        writeFileSync(join(tmp, "apps/today/landing-page/src/WaterButton.tsx"), "");

        const result = storyCoverage(tmp, ["apps/today/landing-page/src/PlantCard.tsx", "apps/today/landing-page/src/WaterButton.tsx"]);
        expect(result).toHaveLength(1);
        expect(result[0]).toContain("PlantCard.stories.tsx");
        expect(result[0]).toContain("WaterButton.stories.tsx");
    });
});

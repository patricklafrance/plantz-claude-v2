import { describe, expect, it } from "vitest";

import { defineConfig, run } from "../src/index.js";
import type { AdlcConfig, OrchestratorOptions } from "../src/index.js";

describe("package entry point", () => {
    it("exports defineConfig", () => {
        expect(typeof defineConfig).toBe("function");
    });

    it("exports run", () => {
        expect(typeof run).toBe("function");
    });

    it("defineConfig returns a valid AdlcConfig", () => {
        const config: AdlcConfig = defineConfig({ ports: { storybook: 6006 } });
        expect(config.ports?.storybook).toBe(6006);
    });

    it("exports OrchestratorOptions type", () => {
        const opts: OrchestratorOptions = { cwd: "/tmp" };
        expect(opts.cwd).toBe("/tmp");
    });
});

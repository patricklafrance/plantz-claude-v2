import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { loadConfig, resolveConfig } from "../src/config.js";

const V3_ROOT = join(__dirname, "..");

describe("this repo's migration config", () => {
    it("loads adlc.config.ts from the v3 root", async () => {
        const config = await loadConfig(V3_ROOT);
        expect(config).toEqual({
            ports: {
                storybook: 6006,
                hostApp: 8080
            },
            agents: {
                coder: {
                    skills: ["accessibility", "frontend-design", "workleap-react-best-practices"]
                }
            }
        });
    });

    it("resolves to expected defaults for this project", async () => {
        const config = await loadConfig(V3_ROOT);
        const resolved = resolveConfig(config);

        // Structure defaults match this repo's layout
        expect(resolved.structure.apps).toBe("./apps");
        expect(resolved.structure.hostApp).toBe("host");
        expect(resolved.structure.modules).toBe("./modules");
        expect(resolved.structure.packages).toBe("./packages");
        expect(resolved.structure.reference).toBe("./agent-docs");

        // Ports match this project's dev servers (browser uses default)
        expect(resolved.ports.storybook).toBe(6006);
        expect(resolved.ports.hostApp).toBe(8080);
        expect(resolved.ports.browser).toBe(9200);

        // Scaffolding defaults
        expect(resolved.scaffolding.packageMeta.license).toBe("Apache-2.0");
    });

    it("produces identical defaults to previous hardcoded behavior", async () => {
        // Before this refactor, the harness had no config — all values were hardcoded.
        // resolveConfig({}) must produce the same structure defaults.
        const emptyResolved = resolveConfig({});

        expect(emptyResolved.structure).toEqual({
            apps: "./apps",
            hostApp: "host",
            modules: "./modules",
            packages: "./packages",
            reference: "./agent-docs"
        });

        expect(emptyResolved.scaffolding.packageMeta.license).toBe("Apache-2.0");
        expect(emptyResolved.agents).toEqual({});
    });
});

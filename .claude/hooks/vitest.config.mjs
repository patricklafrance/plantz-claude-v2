import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        root: ".claude/hooks",
        include: ["tests/**/*.test.mjs"],
        testTimeout: 30_000,
        pool: "forks",
        maxWorkers: 4,
        minWorkers: 1
    }
});

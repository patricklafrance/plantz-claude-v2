import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        root: ".claude/hooks",
        include: ["tests/**/*.test.mjs"],
        testTimeout: 5 * 60_000,
        pool: "threads"
    }
});

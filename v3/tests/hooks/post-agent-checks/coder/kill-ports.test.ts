import { describe, expect, it } from "vitest";

import { killPorts } from "../../../../src/hooks/verification/coder/kill-ports.js";

describe("kill-ports", () => {
    it("should not throw with ports", () => {
        expect(() => killPorts([6006, 8080])).not.toThrow();
    });

    it("should not throw with empty array", () => {
        expect(() => killPorts([])).not.toThrow();
    });
});

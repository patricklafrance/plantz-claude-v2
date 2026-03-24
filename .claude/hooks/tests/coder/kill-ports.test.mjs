import { describe, expect, it } from "vitest";

import { killPorts } from "../../src/adlc-verification/coder/kill-ports.mjs";

describe("kill-ports", () => {
    it("should not throw", () => {
        expect(() => killPorts()).not.toThrow();
    });
});

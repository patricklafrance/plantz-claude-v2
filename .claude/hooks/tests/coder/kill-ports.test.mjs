import { describe, expect, it } from "vitest";

import { killPorts } from "../../adlc-verification/coder/kill-ports.mjs";

describe("kill-ports", () => {
    it("should not throw", () => {
        expect(() => killPorts()).not.toThrow();
    });
});

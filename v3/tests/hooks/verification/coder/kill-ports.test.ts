import { describe, expect, it } from "vitest";

import { killPorts } from "../../../../src/hooks/verification/coder/kill-ports.js";

describe("kill-ports", () => {
    it("should not throw", () => {
        expect(() => killPorts()).not.toThrow();
    });
});

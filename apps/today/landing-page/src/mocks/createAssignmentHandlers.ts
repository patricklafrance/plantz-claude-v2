import { http, HttpResponse } from "msw";

import type { ResponsibilityAssignment } from "@packages/core-plants/assignment";

export function createAssignmentHandlers(assignments: ResponsibilityAssignment[]) {
    return [
        http.get("/api/today/assignments", () => {
            return HttpResponse.json(assignments);
        })
    ];
}
